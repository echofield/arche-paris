-- Reconcile legacy journal_entries installs with the card-gate write contract.
-- Legacy deployments created public.journal_entries with vault_id UUID NOT NULL.
-- Card Gate writes insert card_id/place_id/content/updated_at/idempotency_key only.
-- Reads can succeed on hybrid schemas while inserts fail with 500 on /journal/entries.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS card_id TEXT;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS place_id TEXT;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

UPDATE public.journal_entries
SET place_id = '__my_paris__'
WHERE place_id IS NULL;

ALTER TABLE public.journal_entries
  ALTER COLUMN place_id SET DEFAULT '__my_paris__';

ALTER TABLE public.journal_entries
  ALTER COLUMN place_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'journal_entries'
      AND column_name = 'vault_id'
      AND is_nullable = 'NO'
  ) THEN
    EXECUTE 'ALTER TABLE public.journal_entries ALTER COLUMN vault_id DROP NOT NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_journal_entries_card_place
  ON public.journal_entries (card_id, place_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_idempotency
  ON public.journal_entries (card_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
