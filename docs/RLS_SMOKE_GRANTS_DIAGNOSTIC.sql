-- Diagnostic : tables public qui ont encore des GRANT anon/authenticated (ou PUBLIC) avec privilèges données.
-- Même logique que le canari (get_rls_smoke_status_v2) : grantee anon ou NULL (= PUBLIC) ou authenticated, privs ~ '[arwdDxt]'.
-- Exécuter en SQL Editor ou psql pour lister les tables à traiter avant la migration corrective.

WITH tables AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname = 'public'
),
grants_raw AS (
  SELECT t.oid, t.schema_name, t.table_name, unnest(COALESCE(c.relacl, ARRAY[]::aclitem[])) AS aclitem
  FROM pg_class c
  JOIN tables t ON t.oid = c.oid
),
grants_parsed AS (
  SELECT oid, schema_name, table_name,
         trim(split_part(aclitem::text, '=', 1)) AS grantee_raw,
         split_part(split_part(aclitem::text, '/', 1), '=', 2) AS privs_raw
  FROM grants_raw
),
grants_norm AS (
  SELECT oid, schema_name, table_name,
         CASE WHEN nullif(trim(grantee_raw), '') IS NULL THEN 'public' ELSE trim(grantee_raw) END AS grantee,
         coalesce(trim(privs_raw), '') AS privs
  FROM grants_parsed
),
problematic AS (
  SELECT DISTINCT schema_name, table_name, grantee
  FROM grants_norm
  WHERE privs ~* '[arwdDxt]'
    AND (grantee IN ('anon', 'public') OR grantee = 'authenticated')
)
SELECT schema_name, table_name, grantee
FROM problematic
ORDER BY schema_name, table_name, grantee;
