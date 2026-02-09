-- ARCHÉ — Life Layer Phase 0: Miroir (daily sentence) + Phrases gardées (kept sentences)
-- All access via Card Gate (service_role). No anon access.

-- ---------------------------------------------------------------------------
-- mirror_daily: one sentence per card per day (rules-based selection)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mirror_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  date DATE NOT NULL,
  sentence TEXT NOT NULL,
  anecdote TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mirror_daily_card_date ON public.mirror_daily(card_id, date);

ALTER TABLE public.mirror_daily ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- kept_sentences: user-saved sentences (from Miroir or Champ)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kept_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('mirror', 'champ')),
  source_id_or_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kept_sentences_card ON public.kept_sentences(card_id);

ALTER TABLE public.kept_sentences ENABLE ROW LEVEL SECURITY;
