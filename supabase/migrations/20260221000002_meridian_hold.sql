-- ARCHÉ — Meridian instrument: hold state (ALIGNE only after holding alignment for holdSeconds).
-- Card Gate (service_role) only.

CREATE TABLE IF NOT EXISTS public.meridian_hold (
  card_id TEXT PRIMARY KEY,
  accumulated_hold_seconds DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (accumulated_hold_seconds >= 0),
  last_alignable_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meridian_hold ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access only via service_role (Card Gate).
