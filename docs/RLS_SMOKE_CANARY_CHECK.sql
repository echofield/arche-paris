-- Vérification rapide : fonctions canari présentes et search_path appliqué.
-- Exécuter en tant que rôle avec droits de lecture sur pg_proc / information_schema (ex. postgres, supabase_admin).
-- Usage : psql ... -f docs/RLS_SMOKE_CANARY_CHECK.sql  ou  Supabase SQL Editor.

SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  pg_catalog.pg_get_functiondef(p.oid) AS definition
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_rls_smoke_status_v2', 'get_rls_smoke_status_multi', '_rls_smoke_normalize_schemas')
ORDER BY p.proname;

-- Vérifier que search_path contient public et pg_temp pour les deux fonctions exposées.
SELECT
  p.proname AS function_name,
  p.proconfig AS config  -- search_path etc.
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_rls_smoke_status_v2', 'get_rls_smoke_status_multi');

-- Résumé : 3 lignes attendues (v2, multi, _normalize). Pour v2 et multi, proconfig doit contenir search_path = public, pg_temp.

-- Variante compacte : prosecdef + proconfig uniquement (v2 et multi).
SELECT
  n.nspname AS nsp,
  p.proname,
  p.prosecdef AS secdef,
  p.proconfig AS config
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_rls_smoke_status_v2', 'get_rls_smoke_status_multi')
ORDER BY 1, 2;

-- Exécutions autorisées (sanity check) : qui a EXECUTE sur v2 et multi.
-- Attendu : service_role (et éventuellement owner). Pas public/anon/authenticated.
SELECT routine_schema, routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('get_rls_smoke_status_v2', 'get_rls_smoke_status_multi')
ORDER BY 1, 2, 3;
