-- AUDIT 2025-02-23: RLS smoke test (run after 000001 → 000003 → 000002).
-- Run in Supabase SQL Editor with a session that allows writes (not read-only).
-- Uses temp tables; cleans up inserted rows at the end. No psql-specific syntax.

RESET ALL;
SET statement_timeout TO '45s';
SET lock_timeout TO '5s';

-- 0) gen_random_uuid() is built-in in PostgreSQL 13+; optional pgcrypto for older
DO $$
BEGIN
  IF current_setting('server_version_num', true)::int < 130000 THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- 1) UUIDs de test en session
DROP TABLE IF EXISTS tmp_rls_users;
CREATE TEMP TABLE tmp_rls_users (user_a uuid, user_b uuid) ON COMMIT DROP;
INSERT INTO tmp_rls_users SELECT gen_random_uuid(), gen_random_uuid();

-- 2) Choisir 2 zone_id existantes (schema: zones.zone_id text)
DROP TABLE IF EXISTS tmp_rls_zones;
CREATE TEMP TABLE tmp_rls_zones (zone_id text) ON COMMIT DROP;
INSERT INTO tmp_rls_zones
SELECT z.zone_id FROM public.zones z
LIMIT 2;

SELECT 'PICKED_ZONES' AS note, (SELECT array_agg(zone_id) FROM tmp_rls_zones) AS picked_zones;

-- 3) Vérifier RLS / policies sur user_zone_state
DO $$
DECLARE pol_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_zone_state'
  ) THEN
    RAISE WARNING 'Table public.user_zone_state not found';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_zone_state' AND c.relrowsecurity
  ) THEN
    RAISE WARNING 'RLS is NOT enabled on public.user_zone_state';
  ELSE
    RAISE NOTICE 'RLS is enabled on public.user_zone_state';
  END IF;

  SELECT count(*) INTO pol_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_zone_state';

  IF pol_count < 4 THEN
    RAISE WARNING 'Expected >= 4 policies on public.user_zone_state, got %', pol_count;
  ELSE
    RAISE NOTICE 'Policies on public.user_zone_state: %', pol_count;
  END IF;
END $$;

-- 4) Insertion de lignes de test (schema: user_id, zone_id, state, first_entered_at, revealed_at, awakened_at, updated_at)
WITH zone_list AS (
  SELECT zone_id, row_number() OVER () AS rn FROM tmp_rls_zones
),
ins AS (
  INSERT INTO public.user_zone_state (user_id, zone_id, state, first_entered_at, revealed_at, awakened_at, updated_at)
  SELECT t.user_a, (SELECT zone_id FROM zone_list WHERE rn = 1 LIMIT 1), 'revealed', now(), now(), now(), now()
  FROM tmp_rls_users t
  WHERE (SELECT count(*) FROM tmp_rls_zones) >= 1
  ON CONFLICT (user_id, zone_id) DO UPDATE SET updated_at = now()
  RETURNING *
)
SELECT 'INSERTED' AS note, (SELECT count(*) FROM ins) AS rows_inserted;

WITH zone_list AS (
  SELECT zone_id, row_number() OVER () AS rn FROM tmp_rls_zones
),
ins2 AS (
  INSERT INTO public.user_zone_state (user_id, zone_id, state, first_entered_at, revealed_at, awakened_at, updated_at)
  SELECT t.user_b, (SELECT zone_id FROM zone_list WHERE rn = 2 LIMIT 1), 'revealed', now(), now(), now(), now()
  FROM tmp_rls_users t
  WHERE (SELECT count(*) FROM tmp_rls_zones) >= 2
  ON CONFLICT (user_id, zone_id) DO UPDATE SET updated_at = now()
  RETURNING *
)
SELECT 'INSERTED_B' AS note, (SELECT count(*) FROM ins2) AS rows_inserted;

-- 5) Service-managed: 0 lignes visibles en authenticated sans JWT
SET LOCAL ROLE authenticated;

DO $$
DECLARE cnt bigint;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'arche_rate_limits'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.arche_rate_limits' INTO cnt;
    RAISE NOTICE 'arche_rate_limits count as authenticated (no JWT): % (expect 0)', cnt;
  ELSE
    RAISE NOTICE 'Table public.arche_rate_limits not found (skip)';
  END IF;
END $$;

DO $$
DECLARE cnt bigint;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'activation_codes'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.activation_codes' INTO cnt;
    RAISE NOTICE 'activation_codes count as authenticated (no JWT): % (expect 0)', cnt;
  ELSE
    RAISE NOTICE 'Table public.activation_codes not found (skip)';
  END IF;
END $$;

RESET ROLE;

-- 6) Nettoyage
DELETE FROM public.user_zone_state
WHERE user_id IN (SELECT user_a FROM tmp_rls_users UNION ALL SELECT user_b FROM tmp_rls_users);
SELECT 'CLEANED' AS note;

-- =============================================================================
-- Manual checklist (validate with real JWTs via app or Supabase client)
-- =============================================================================
-- 1. User A: CRUD on user_zone_state, ritual_runs, engravings, etc. → only own rows.
-- 2. User B: same tables → cannot see or modify A's rows.
-- 3. Edge Functions (service_role): access to service-managed tables unchanged.
