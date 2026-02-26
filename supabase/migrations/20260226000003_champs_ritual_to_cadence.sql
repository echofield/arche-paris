-- Rename layer key ritual → cadence (ARCHÉ: cadence = mouvement, fréquence, respiration du lieu).
-- Run after 20260226000001 (and optionally 20260226000002). Idempotent.

-- 1. Migrate existing data: copy ritual → cadence, remove ritual
UPDATE public.champs
SET layers = jsonb_set(layers - 'ritual', '{cadence}', COALESCE(layers->'ritual', '0.5'::jsonb))
WHERE layers ? 'ritual';

-- 2. Keys check: require cadence instead of ritual
ALTER TABLE public.champs DROP CONSTRAINT IF EXISTS champs_layers_keys_check;
ALTER TABLE public.champs ADD CONSTRAINT champs_layers_keys_check
CHECK (layers ? 'trace' AND layers ? 'alignment' AND layers ? 'cadence' AND layers ? 'echo' AND layers ? 'threshold');

-- 3. Values check: if present, re-add with cadence
ALTER TABLE public.champs DROP CONSTRAINT IF EXISTS champs_layers_values_check;
ALTER TABLE public.champs ADD CONSTRAINT champs_layers_values_check
CHECK (
  (layers->>'trace')::numeric BETWEEN 0 AND 1
  AND (layers->>'alignment')::numeric BETWEEN 0 AND 1
  AND (layers->>'cadence')::numeric BETWEEN 0 AND 1
  AND (layers->>'echo')::numeric BETWEEN 0 AND 1
  AND (layers->>'threshold')::numeric BETWEEN 0 AND 1
);
