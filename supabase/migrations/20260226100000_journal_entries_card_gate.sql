-- Card Gate journal/note and journal/entries: table expected by supabase/functions/card-gate (GET/POST /journal/note, POST /journal/entries).
-- Without this table, those endpoints return 500 and traces/notes show "1 en attente" / "Réessayer".

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  place_id TEXT NOT NULL DEFAULT '__my_paris__',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_card_place
  ON public.journal_entries (card_id, place_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_idempotency
  ON public.journal_entries (card_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- RLS: access only via service_role (card-gate). No policies = deny for anon/authenticated.
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.journal_entries IS 'Card Gate: journal note (place_id=__my_paris__) and journal entries; service_role only.';
