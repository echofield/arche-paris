-- RPC pour le canari Edge Function "rls-smoke" : retourne un agrégat de l'état RLS.
-- ok = (anon_has_grant = 0 AND authenticated_has_grant = 0).
-- Exécutable par service_role uniquement (REVOKE public/anon/authenticated).
-- À adapter si noms de schémas/tables diffèrent (filtrer n.nspname ou étendre la liste).

CREATE OR REPLACE FUNCTION public.get_rls_smoke_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_total int := 0;
  v_no_policy int := 0;
  v_anon_grants int := 0;
  v_auth_grants int := 0;
  v_ok boolean := false;
BEGIN
  /*
    Hypothèses:
    - On cible uniquement le schéma public (adapter si besoin).
    - Détection des tables candidates: relkind = 'r' (tables ordinaires).
    - "tables_without_policy": tables sans AUCUNE policy.
    - "anon_has_grant": nombre de tables où le rôle "anon" ou PUBLIC a des privilèges explicites (SELECT/INSERT/UPDATE/DELETE).
    - "authenticated_has_grant": idem pour "authenticated".
  */
  WITH tables AS (
    SELECT c.oid,
           n.nspname AS schema_name,
           c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
  ),
  policies AS (
    SELECT t.oid,
           count(p.*) AS policy_count
    FROM tables t
    LEFT JOIN pg_policies p ON p.schemaname = t.schema_name AND p.tablename = t.table_name
    GROUP BY t.oid
  ),
  grants_raw AS (
    SELECT t.oid,
           unnest(COALESCE(c.relacl, ARRAY[]::aclitem[])) AS aclitem
    FROM pg_class c
    JOIN tables t ON t.oid = c.oid
  ),
  grants_parsed AS (
    SELECT g.oid,
           split_part(g.aclitem::text, '=', 1) AS grantee_raw,
           split_part(split_part(g.aclitem::text, '/', 1), '=', 2) AS privs_raw
    FROM grants_raw g
  ),
  grants_norm AS (
    SELECT oid,
           nullif(grantee_raw, '') AS grantee,
           coalesce(privs_raw, '') AS privs
    FROM grants_parsed
  ),
  agg AS (
    SELECT
      (SELECT count(*) FROM tables) AS total_tables_tested,
      (SELECT count(*) FROM policies WHERE policy_count = 0) AS tables_without_policy,
      (
        SELECT count(DISTINCT oid)
        FROM grants_norm
        WHERE (grantee = 'anon' OR grantee IS NULL)
          AND privs ~* '[arwdDxt]'
      ) AS anon_has_grant,
      (
        SELECT count(DISTINCT oid)
        FROM grants_norm
        WHERE grantee = 'authenticated'
          AND privs ~* '[arwdDxt]'
      ) AS authenticated_has_grant
  )
  SELECT
    total_tables_tested,
    tables_without_policy,
    anon_has_grant,
    authenticated_has_grant
  INTO
    v_total, v_no_policy, v_anon_grants, v_auth_grants
  FROM agg;

  v_ok := (COALESCE(v_anon_grants, 0) = 0 AND COALESCE(v_auth_grants, 0) = 0);

  RETURN jsonb_build_object(
    'ok', COALESCE(v_ok, false),
    'total_tables_tested', COALESCE(v_total, 0),
    'tables_without_policy', COALESCE(v_no_policy, 0),
    'anon_has_grant', COALESCE(v_anon_grants, 0),
    'authenticated_has_grant', COALESCE(v_auth_grants, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_rls_smoke_status() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_smoke_status() TO service_role;

COMMENT ON FUNCTION public.get_rls_smoke_status() IS
  'Canari RLS : récap minimal pour Edge Function rls-smoke (alertes/monitoring). ok=true si anon et authenticated n''ont pas de grants directs. PUBLIC compté côté anon.';
