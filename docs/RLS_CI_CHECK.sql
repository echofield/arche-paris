-- AUDIT 2025-02-23: CI check — RLS + policies + GRANTs sur les tables owner (user_id).
-- Exécutable en lecture seule. Échoue (RAISE EXCEPTION) si RLS absente, < 4 policies,
-- commandes manquantes, ou privilèges directs pour anon.
-- Usage CI : psql -v ON_ERROR_STOP=1 -f docs/RLS_CI_CHECK.sql ou supabase db execute -f docs/RLS_CI_CHECK.sql

DO $$
DECLARE
  local_tables text[] := ARRAY['user_zone_state'];
  t text;
  v_rls_enabled boolean;
  v_policy_count int;
  v_has_select boolean;
  v_has_insert boolean;
  v_has_update boolean;
  v_has_delete boolean;
  v_bad_grants int;
  v_ok_count int := 0;
BEGIN
  RAISE NOTICE 'RLS CI check: tables cibles = %', local_tables;
  FOREACH t IN ARRAY local_tables LOOP
    -- RLS activée
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = t;

    IF COALESCE(v_rls_enabled, false) = false THEN
      RAISE EXCEPTION 'RLS CI check: ÉCHEC — RLS désactivée sur public.%', t;
    END IF;

    -- Policies >= 4
    SELECT count(*) INTO v_policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t;

    IF v_policy_count < 4 THEN
      RAISE EXCEPTION 'RLS CI check: ÉCHEC — Moins de 4 policies sur public.% (trouvé: %)', t, v_policy_count;
    END IF;

    -- Couverture des 4 commandes (bool_or IS TRUE évite NULL ambigu)
    SELECT
      (bool_or(COALESCE(p.cmd, '') = 'SELECT') IS TRUE),
      (bool_or(COALESCE(p.cmd, '') = 'INSERT') IS TRUE),
      (bool_or(COALESCE(p.cmd, '') = 'UPDATE') IS TRUE),
      (bool_or(COALESCE(p.cmd, '') = 'DELETE') IS TRUE)
    INTO v_has_select, v_has_insert, v_has_update, v_has_delete
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t;

    IF NOT (COALESCE(v_has_select, false) AND COALESCE(v_has_insert, false) AND COALESCE(v_has_update, false) AND COALESCE(v_has_delete, false)) THEN
      RAISE NOTICE 'RLS CI check: commande(s) manquante(s) sur public.% — SELECT=%, INSERT=%, UPDATE=%, DELETE=%', t, v_has_select, v_has_insert, v_has_update, v_has_delete;
      RAISE EXCEPTION 'RLS CI check: ÉCHEC — Couverture incomplète des commandes sur public.% (SELECT=%, INSERT=%, UPDATE=%, DELETE=%)',
        t, v_has_select, v_has_insert, v_has_update, v_has_delete;
    END IF;

    -- Aucun privilège direct pour anon (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER)
    SELECT count(*) INTO v_bad_grants
    FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public'
      AND g.table_name = t
      AND g.grantee = 'anon'
      AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

    IF v_bad_grants > 0 THEN
      RAISE EXCEPTION 'RLS CI check: ÉCHEC — Le rôle "anon" possède % privilèges directs sur public.%. Supprimez ces GRANTs (ex. docs/RLS_GRANTS_FIX.sql).', v_bad_grants, t;
    END IF;

    RAISE NOTICE 'RLS CI check: OK sur public.% (RLS active, policies >= 4, 4 commandes, pas de GRANTs anon)', t;
    v_ok_count := v_ok_count + 1;
  END LOOP;
  RAISE NOTICE 'RLS CI check: OK (% table(s) vérifiée(s)).', v_ok_count;
END $$;

-- Optionnel — décommenter pour exiger qu'authenticated n'ait aucun privilège direct sur les tables owner
-- (modèle strict : seul RLS + policies gouverne l'accès). À ne pas activer si vous accordez volontairement
-- SELECT à authenticated pour des vues ou usages contrôlés.
/*
DO $$
DECLARE
  local_tables text[] := ARRAY['user_zone_state'];
  t text;
  v_bad int;
BEGIN
  FOREACH t IN ARRAY local_tables LOOP
    SELECT count(*) INTO v_bad
    FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.table_name = t
      AND g.grantee = 'authenticated'
      AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');
    IF v_bad > 0 THEN
      RAISE EXCEPTION 'RLS CI check (authenticated): ÉCHEC — "authenticated" possède % privilèges directs sur public.%', v_bad, t;
    END IF;
    RAISE NOTICE 'RLS CI check (GRANTs authenticated): OK — Aucun privilège direct sur public.%', t;
  END LOOP;
END $$;
*/

-- Optionnel — décommenter si une séquence dédiée existe (ex. bigserial/identity) et doit être protégée :
/*
DO $$
DECLARE
  v_bad_seq_grants int;
BEGIN
  SELECT count(*) INTO v_bad_seq_grants
  FROM information_schema.role_usage_grants u
  WHERE u.object_schema = 'public'
    AND u.object_name = 'user_zone_state_id_seq'
    AND u.grantee = 'anon';

  IF v_bad_seq_grants > 0 THEN
    RAISE EXCEPTION 'RLS CI check: ÉCHEC — Le rôle "anon" possède des privilèges sur la séquence public.user_zone_state_id_seq.';
  END IF;

  RAISE NOTICE 'RLS CI check (GRANTs séquence): OK — Aucun privilège pour "anon" sur public.user_zone_state_id_seq';
END $$;
*/

-- Optionnel — vues / vues matérialisées : si vous ajoutez des vues (ou MV) avec RLS,
-- vérifier les GRANTs via information_schema.role_table_grants (table_schema, table_name, grantee, privilege_type)
-- pour les vues ; pour les MV : pg_matviews (schemaname, matviewname) + pg_class.relkind = 'm'.
-- Adapter local_tables pour inclure les noms de vues/MV et boucler sur role_table_grants.

-- Optionnel — TRUNCATE : si vous verrouillez TRUNCATE via policies (policy FOR TRUNCATE ou FOR ALL),
-- ajouter une vérification bool_or(p.cmd = 'TRUNCATE') ou équivalent selon vos invariants. Sinon, le contrôle actuel suffit.
