-- Révocation complète anon + authenticated sur toutes les tables du schéma public.
-- Aligne avec le modèle "100 % RLS" : plus de GRANT directs, accès uniquement via policies.
-- Idempotent : REVOKE sur des privilèges déjà absents ne fait pas d'erreur.
--
-- À exécuter après le diagnostic (docs/RLS_SMOKE_GRANTS_DIAGNOSTIC.sql) si le canari reste en schemas_failed.
-- Vérifier que les tables qui doivent rester accessibles ont des policies RLS avant de pousser.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE ALL ON %I.%I FROM anon', r.schema_name, r.table_name);
    EXECUTE format('REVOKE ALL ON %I.%I FROM authenticated', r.schema_name, r.table_name);
    EXECUTE format('REVOKE ALL ON %I.%I FROM public', r.schema_name, r.table_name);
  END LOOP;
END $$;
