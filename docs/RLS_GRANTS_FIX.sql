-- AUDIT 2025-02-23: Aligner les GRANTs avec le modèle RLS.
-- À exécuter après 000001, 000003, 000002 si le smoke test montre anon/authenticated
-- avec des privilèges complets sur les tables service-managed ou user_zone_state pour anon.
--
-- Variante "safe": REVOKE uniquement si la table existe (idempotent, sans erreur si table absente).
-- Effet:
--   anon: aucun accès aux tables owner ni service-managed.
--   authenticated: rien sur tables service-managed; garde SELECT/INSERT/UPDATE/DELETE sur tables owner (000002).
--   service_role: inchangé (aucun REVOKE sur service_role).
--
-- Rappel: les GRANTs au rôle service_role contournent RLS (bypass). Ils doivent être utilisés
-- avec prudence, uniquement côté backend (Edge Functions, jobs, etc.), jamais exposés au client.

DO $$
DECLARE
  tbl text;
BEGIN
  -- 1) Tables "owner" (user_id): retirer anon uniquement
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

  -- 2) Tables service-managed: retirer anon et authenticated
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
