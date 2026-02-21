-- ARCHÉ — Meridian instrument v1: EMA state + place recognition persistence.
-- Access via Card Gate (service_role). Two tables only; no event log in v1.

-- ---------------------------------------------------------------------------
-- meridian_instrument_state (prev alignment index for EMA smoothing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meridian_instrument_state (
  card_id TEXT PRIMARY KEY,
  alignment_index DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (alignment_index >= 0 AND alignment_index <= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- meridian_place_recognized (ever recognized: card + place, first time in radius)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meridian_place_recognized (
  card_id TEXT NOT NULL,
  place_id TEXT NOT NULL CHECK (place_id IN ('saint-sulpice', 'horloge', 'point-zero')),
  recognized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_meridian_place_recognized_card
  ON public.meridian_place_recognized (card_id);

ALTER TABLE public.meridian_instrument_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meridian_place_recognized ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access only via service_role (Card Gate).
