-- AUDIT 2025-02-23: RLS smoke test — READ-ONLY variant.
-- Safe for SQL Editor in read-only mode: no DROP/CREATE TEMP TABLE, no INSERT/DELETE.
-- Validates: RLS on user_zone_state, policy count, sample zone_id, GRANTs, service-managed visibility.
-- Sur bases volumineuses, exécuter en heures creuses (jointures pg_catalog / information_schema).
--
-- Transaction : ne pas exécuter dans une transaction englobante si vous utilisez SET LOCAL
-- (les SET LOCAL n’ont d’effet que dans la transaction en cours).
-- Astuce : utiliser psql avec -1 (single-transaction) si vous souhaitez encapsuler,
-- sinon éviter toute transaction externe pour que SET LOCAL soit effectif.
-- Compat : testé avec psql ≥ 12.

\pset format unaligned
\pset pager off
\set ON_ERROR_STOP on

SET statement_timeout TO '30s';

-- Flag : inclure les vues sensibles (v_%) dans la section GRANTs. 'on' = oui, autre = non (défaut).
SET LOCAL app.include_sensitive_views = 'off';

-- Flag : schéma cible pour le récap CI. Défaut 'public'. Permet d'élargir le périmètre sans modifier les CTE.
SET LOCAL app.scope_schema = 'public';

-- 1) Sample zone_id from public.zones (for manual tests)
SELECT 'PICKED_ZONES' AS note, array_agg(zone_id) AS zone_ids
FROM (SELECT zone_id FROM public.zones LIMIT 2) z;

-- 2) RLS and policies on user_zone_state
DO $$
DECLARE
  rls_on boolean;
  pol_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_zone_state'
  ) THEN
    RAISE WARNING 'RLS SMOKE (read-only): Table public.user_zone_state not found';
    RETURN;
  END IF;

  SELECT c.relrowsecurity INTO rls_on
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'user_zone_state';

  IF NOT rls_on THEN
    RAISE WARNING 'RLS SMOKE (read-only): RLS is NOT enabled on public.user_zone_state';
  ELSE
    RAISE NOTICE 'RLS SMOKE (read-only): RLS is enabled on public.user_zone_state';
  END IF;

  SELECT count(*) INTO pol_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_zone_state';

  IF pol_count < 4 THEN
    RAISE WARNING 'RLS SMOKE (read-only): Expected >= 4 policies on user_zone_state, got %', pol_count;
  ELSE
    RAISE NOTICE 'RLS SMOKE (read-only): Policies on user_zone_state: %', pol_count;
  END IF;
END $$;

-- 3) Policy names (informational)
SELECT 'POLICIES_user_zone_state' AS note, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_zone_state'
ORDER BY policyname;

-- 4) GRANTs on user_zone_state and service-managed tables (COALESCE → '(none)' si aucun privilège)
SELECT
  'GRANTS' AS note,
  grantee,
  table_name,
  COALESCE(string_agg(privilege_type, ', ' ORDER BY privilege_type), '(none)') AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('user_zone_state', 'arche_rate_limits', 'activation_codes')
  AND grantee IN ('authenticated', 'service_role', 'anon')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- 4b) GRANTs vues sensibles (uniquement si app.include_sensitive_views = 'on')
SELECT
  'GRANTS_views' AS note,
  grantee,
  table_name,
  COALESCE(string_agg(privilege_type, ', ' ORDER BY privilege_type), '(none)') AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND (table_name IN ('user_zone_state', 'arche_rate_limits', 'activation_codes') OR table_name LIKE 'v_%')
  AND grantee IN ('authenticated', 'service_role', 'anon')
  AND current_setting('app.include_sensitive_views', true) = 'on'
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- 5) Service-managed visibility (authenticated sans JWT → attendu 0)
-- NOTICE : expect 0 unless an anon/authenticated policy exists on these tables (service-managed = backend only).
-- Certains environnements (ex. SQL Editor) refusent SET ROLE → on capture insufficient_privilege pour éviter un faux négatif.
DO $$
DECLARE
  cnt bigint;
BEGIN
  BEGIN
    SET LOCAL ROLE authenticated;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'skip: cannot SET ROLE (restricted environment) — run counts manually as authenticated if needed';
      RETURN;
  END;

  RAISE NOTICE 'SERVICE_MANAGED: expect 0 unless an anon/authenticated policy exists on these tables';

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'arche_rate_limits') THEN
    EXECUTE 'SELECT count(*) FROM public.arche_rate_limits' INTO cnt;
    RAISE NOTICE 'COUNT_authenticated.arche_rate_limits: % (expect 0)', cnt;
  ELSE
    RAISE NOTICE 'COUNT_authenticated.arche_rate_limits: table_absent';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'activation_codes') THEN
    EXECUTE 'SELECT count(*) FROM public.activation_codes' INTO cnt;
    RAISE NOTICE 'COUNT_authenticated.activation_codes: % (expect 0)', cnt;
  ELSE
    RAISE NOTICE 'COUNT_authenticated.activation_codes: table_absent';
  END IF;

  RESET ROLE;
END $$;

-- Alternative si SET ROLE interdit (block skipped) : exécuter à la main avec une session authentifiée (JWT) :
--   SELECT count(*) FROM public.arche_rate_limits;   -- attendu 0
--   SELECT count(*) FROM public.activation_codes;    -- attendu 0

-- 6) Récap final pour usage CI (une seule ligne)
-- Schéma cible : current_setting('app.scope_schema', true), défaut 'public'.
-- total_tables_tested = tables dans le périmètre ; tables_without_policy = sans aucune policy ;
-- tables_with_policy_but_anon_has_grant = ont des policies mais anon a un GRANT direct (à corriger) ;
-- tables_with_policy_but_authenticated_has_grant = idem pour authenticated (optionnel si modèle 100 % RLS).
WITH scope AS (
  SELECT unnest(ARRAY['user_zone_state', 'arche_rate_limits', 'activation_codes']) AS tname
),
scope_schema AS (SELECT COALESCE(nullif(current_setting('app.scope_schema', true), ''), 'public') AS sch),
policy_count AS (
  SELECT p.tablename AS tname, count(*) AS n
  FROM pg_policies p
  CROSS JOIN scope_schema s
  WHERE p.schemaname = s.sch
    AND p.tablename IN (SELECT tname FROM scope)
  GROUP BY p.tablename
),
anon_grants AS (
  SELECT g.table_name AS tname
  FROM information_schema.role_table_grants g
  CROSS JOIN scope_schema s
  WHERE g.table_schema = s.sch
    AND g.grantee = 'anon'
    AND g.table_name IN (SELECT tname FROM scope)
),
authenticated_grants AS (
  SELECT g.table_name AS tname
  FROM information_schema.role_table_grants g
  CROSS JOIN scope_schema s
  WHERE g.table_schema = s.sch
    AND g.grantee = 'authenticated'
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    AND g.table_name IN (SELECT tname FROM scope)
)
SELECT
  'RLS_SMOKE_RECAP' AS note,
  (SELECT count(*) FROM scope) AS total_tables_tested,
  (SELECT count(*) FROM scope s
   LEFT JOIN policy_count p ON p.tname = s.tname
   WHERE p.n IS NULL OR p.n = 0) AS tables_without_policy,
  (SELECT count(DISTINCT p.tname)
   FROM policy_count p
   INNER JOIN anon_grants a ON a.tname = p.tname
   WHERE p.n > 0) AS tables_with_policy_but_anon_has_grant,
  (SELECT count(DISTINCT p.tname)
   FROM policy_count p
   INNER JOIN authenticated_grants ag ON ag.tname = p.tname
   WHERE p.n > 0) AS tables_with_policy_but_authenticated_has_grant;

-- NOTICE en exécution locale si une métrique de grants > 0
DO $$
DECLARE
  v_anon bigint;
  v_auth bigint;
BEGIN
  WITH scope AS (SELECT unnest(ARRAY['user_zone_state', 'arche_rate_limits', 'activation_codes']) AS tname),
       scope_schema AS (SELECT COALESCE(nullif(current_setting('app.scope_schema', true), ''), 'public') AS sch),
       policy_count AS (
         SELECT p.tablename AS tname, count(*) AS n
         FROM pg_policies p
         CROSS JOIN scope_schema s
         WHERE p.schemaname = s.sch AND p.tablename IN (SELECT tname FROM scope)
         GROUP BY p.tablename
       ),
       anon_grants AS (
         SELECT g.table_name AS tname
         FROM information_schema.role_table_grants g
         CROSS JOIN scope_schema s
         WHERE g.table_schema = s.sch AND g.grantee = 'anon' AND g.table_name IN (SELECT tname FROM scope)
       ),
       authenticated_grants AS (
         SELECT g.table_name AS tname
         FROM information_schema.role_table_grants g
         CROSS JOIN scope_schema s
         WHERE g.table_schema = s.sch AND g.grantee = 'authenticated'
           AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
           AND g.table_name IN (SELECT tname FROM scope)
       ),
       rec AS (
         SELECT
           (SELECT count(DISTINCT p.tname) FROM policy_count p INNER JOIN anon_grants a ON a.tname = p.tname WHERE p.n > 0) AS anon_g,
           (SELECT count(DISTINCT p.tname) FROM policy_count p INNER JOIN authenticated_grants ag ON ag.tname = p.tname WHERE p.n > 0) AS auth_g
       )
  SELECT rec.anon_g, rec.auth_g INTO v_anon, v_auth FROM rec;
  IF COALESCE(v_anon, 0) > 0 THEN
    RAISE NOTICE 'Heads-up: anon_grants=% (fail CI if not allowed)', v_anon;
  END IF;
  IF COALESCE(v_auth, 0) > 0 THEN
    RAISE NOTICE 'Heads-up: authenticated_grants=% (fail CI if 100%% RLS)', v_auth;
  END IF;
END $$;

-- CI : une ligne CSV pour parsing robuste (grep RECAP_CSV puis parser les champs).
-- Ce run inclut ou exclut les vues sensibles selon app.include_sensitive_views ; tenir compte de ce flag lors de comparaisons inter-runs.
-- Format : RECAP_CSV:total_tables_tested,tables_without_policy,anon_has_grant,authenticated_has_grant
-- Ne pas renommer le préfixe RECAP_CSV (convention pour le grep CI).
SET LOCAL lc_numeric = 'C';

\pset tuples_only on
WITH scope AS (SELECT unnest(ARRAY['user_zone_state', 'arche_rate_limits', 'activation_codes']) AS tname),
     scope_schema AS (SELECT COALESCE(nullif(current_setting('app.scope_schema', true), ''), 'public') AS sch),
     policy_count AS (
       SELECT p.tablename AS tname, count(*) AS n
       FROM pg_policies p CROSS JOIN scope_schema s
       WHERE p.schemaname = s.sch AND p.tablename IN (SELECT tname FROM scope)
       GROUP BY p.tablename
     ),
     anon_grants AS (
       SELECT g.table_name AS tname
       FROM information_schema.role_table_grants g CROSS JOIN scope_schema s
       WHERE g.table_schema = s.sch AND g.grantee = 'anon' AND g.table_name IN (SELECT tname FROM scope)
     ),
     authenticated_grants AS (
       SELECT g.table_name AS tname
       FROM information_schema.role_table_grants g CROSS JOIN scope_schema s
       WHERE g.table_schema = s.sch AND g.grantee = 'authenticated'
         AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
         AND g.table_name IN (SELECT tname FROM scope)
     ),
     rec AS (
       SELECT
         (SELECT count(*) FROM scope) AS total_tables_tested,
         (SELECT count(*) FROM scope s LEFT JOIN policy_count p ON p.tname = s.tname WHERE p.n IS NULL OR p.n = 0) AS tables_without_policy,
         (SELECT count(DISTINCT p.tname) FROM policy_count p INNER JOIN anon_grants a ON a.tname = p.tname WHERE p.n > 0) AS anon_has_grant,
         (SELECT count(DISTINCT p.tname) FROM policy_count p INNER JOIN authenticated_grants ag ON ag.tname = p.tname WHERE p.n > 0) AS authenticated_has_grant
     )
SELECT 'RECAP_CSV:' || (SELECT format('%s,%s,%s,%s', total_tables_tested, tables_without_policy, anon_has_grant, authenticated_has_grant) FROM rec) AS rls_smoke_recap;

\pset tuples_only off

-- =============================================================================
-- Summary: RLS enabled + >= 4 policies + GRANTs + service-managed 0 rows = OK.
-- Full test (insert/cleanup) requires docs/RLS_SMOKE_TEST.sql in a write-enabled session.
-- User A/B isolation: validate manually with two real accounts.
-- CI: fail if RLS_SMOKE_RECAP.tables_with_policy_but_anon_has_grant > 0 (configurable).
-- Optionnel: fail if tables_with_policy_but_authenticated_has_grant > 0 (si modèle 100 % RLS).
-- =============================================================================
--
-- Exemple multi-exécution (comparer vues on/off) : exécuter une première fois tel quel, puis
--   SET LOCAL app.include_sensitive_views = 'on';
--   SET LOCAL app.scope_schema = 'public';
-- et re-SELECT uniquement le bloc CI (WITH scope AS ... SELECT 'RECAP_CSV:' ...) pour obtenir
-- une seconde ligne RECAP_CSV et comparer les compteurs.
--
-- Autre schéma : SET LOCAL app.scope_schema = 'xxx'; avant exécution (ou en tête de script).
--
-- Validations locales rapides : tester sur (1) schéma vide, (2) schéma avec tables sans RLS,
-- (3) schéma mixte (RLS on/off, app.include_sensitive_views on/off). Vérifier que la dernière
-- ligne est unique et commence par RECAP_CSV: et que \pset tuples_only on/off encadre bien le SELECT récap.
--
-- Migration 100 % RLS : au moment d’activer le preset (deux variables à 0), prévoir une courte
-- fenêtre de monitoring : utiliser le récap du job summary sur quelques runs pour confirmer
-- qu’aucune table legacy ne fuit des grants. Rejouer à la demande via workflow_dispatch (Actions
-- → RLS Smoke Recap → Run workflow) ou label GitHub "RLS-hardening" si branch protection l’exige.
-- =============================================================================
