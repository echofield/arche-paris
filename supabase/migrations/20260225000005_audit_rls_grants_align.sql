-- AUDIT 2025-02-23: Align GRANTs with RLS model (idempotent).
-- - anon: no direct grants on owner or service-managed tables
-- - authenticated: no direct grants on service-managed tables
-- - service_role: unchanged

DO $$
DECLARE
  tbl text;
BEGIN
  -- 1) Owner tables (user_id): remove anon grants only
  FOREACH tbl IN ARRAY ARRAY[
    'user_zone_state', 'ritual_runs', 'engravings', 'zone_engravings',
    'user_complexion', 'complexion_deltas', 'paths', 'challenges',
    'challenge_attempts', 'personal_bests', 'zone_resonance', 'zone_custodians'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
    END IF;
  END LOOP;

  -- 2) Service-managed tables: remove anon + authenticated grants
  FOREACH tbl IN ARRAY ARRAY[
    'arche_rate_limits', 'activation_codes', 'vaults', 'journal_entries', 'rate_limits'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = tbl
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', tbl);
    END IF;
  END LOOP;
END $$;
