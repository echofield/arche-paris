-- ARCHÉ — Life Layer Phase 0: opt-in to Champ (Le Champ)
-- When true, inscription is eligible to be copied to inscriptions_field in Phase 1.

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS opt_in_field BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.inscriptions.opt_in_field IS 'If true, eligible for Le Champ (collective, anonymous, fading).';
