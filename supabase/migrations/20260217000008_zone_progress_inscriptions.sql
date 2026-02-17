-- ============================================
-- ARCHÉ v0.1.1 — Zone Progress + Inscriptions
-- Makes the game loop visible and completable
-- ============================================

-- =========================
-- ZONE PROGRESS (per user per zone)
-- Tracks which objectives are complete
-- =========================
CREATE TABLE IF NOT EXISTS public.zone_progress (
  user_id uuid NOT NULL,
  zone_id text NOT NULL REFERENCES public.zones(zone_id),

  -- Objectives (boolean flags)
  entered boolean NOT NULL DEFAULT false,
  entered_at timestamptz,

  presence_ritual boolean NOT NULL DEFAULT false,
  presence_ritual_at timestamptz,

  observation_ritual boolean NOT NULL DEFAULT false,
  observation_ritual_at timestamptz,

  engraved boolean NOT NULL DEFAULT false,
  engraved_at timestamptz,

  is_custodian boolean NOT NULL DEFAULT false,
  custodian_since timestamptz,

  -- Computed
  objectives_complete integer GENERATED ALWAYS AS (
    (CASE WHEN entered THEN 1 ELSE 0 END) +
    (CASE WHEN presence_ritual THEN 1 ELSE 0 END) +
    (CASE WHEN observation_ritual THEN 1 ELSE 0 END) +
    (CASE WHEN engraved THEN 1 ELSE 0 END) +
    (CASE WHEN is_custodian THEN 1 ELSE 0 END)
  ) STORED,

  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, zone_id)
);

CREATE INDEX idx_zone_progress_user ON public.zone_progress(user_id, objectives_complete DESC);

-- =========================
-- ZONE INSCRIPTIONS (public sentences)
-- Graffiti / prayer / note left on territory
-- =========================
CREATE TABLE IF NOT EXISTS public.zone_inscriptions (
  inscription_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL REFERENCES public.zones(zone_id),
  user_id uuid NOT NULL,

  -- Content
  text text NOT NULL CHECK (char_length(text) BETWEEN 5 AND 140),

  -- Optional: more precise location within zone
  lat double precision,
  lng double precision,

  -- Moderation
  status text NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden', 'flagged')),
  flag_count integer NOT NULL DEFAULT 0,

  -- Privacy (pseudonymous by default)
  display_name text,  -- optional pseudonym

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Link to ritual that earned this (optional)
  source_event_id uuid REFERENCES public.arche_events(event_id)
);

CREATE INDEX idx_inscriptions_zone ON public.zone_inscriptions(zone_id, status, created_at DESC);
CREATE INDEX idx_inscriptions_user ON public.zone_inscriptions(user_id, created_at DESC);

-- Rate limit enforced in edge function (not via unique index due to IMMUTABLE constraint)

-- =========================
-- RLS POLICIES
-- =========================

-- Zone progress: user can only see/modify their own
ALTER TABLE public.zone_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS zone_progress_user_all ON public.zone_progress;
CREATE POLICY zone_progress_user_all ON public.zone_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS zone_progress_service ON public.zone_progress;
CREATE POLICY zone_progress_service ON public.zone_progress
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Inscriptions: anyone can read visible, owner can read own, service can write
ALTER TABLE public.zone_inscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inscriptions_read_visible ON public.zone_inscriptions;
CREATE POLICY inscriptions_read_visible ON public.zone_inscriptions
  FOR SELECT TO authenticated, anon
  USING (status = 'visible');

DROP POLICY IF EXISTS inscriptions_read_own ON public.zone_inscriptions;
CREATE POLICY inscriptions_read_own ON public.zone_inscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS inscriptions_service ON public.zone_inscriptions;
CREATE POLICY inscriptions_service ON public.zone_inscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================
-- PROJECTOR UPDATES
-- Update zone_progress when events occur
-- =========================

CREATE OR REPLACE FUNCTION public.update_zone_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- zone_entered → mark entered
  IF NEW.event_type = 'zone_entered' AND NEW.zone_id IS NOT NULL THEN
    INSERT INTO public.zone_progress (user_id, zone_id, entered, entered_at, updated_at)
    VALUES (NEW.user_id, NEW.zone_id, true, NEW.ts, now())
    ON CONFLICT (user_id, zone_id) DO UPDATE SET
      entered = true,
      entered_at = COALESCE(zone_progress.entered_at, EXCLUDED.entered_at),
      updated_at = now();
  END IF;

  -- ritual_completed → mark ritual type
  IF NEW.event_type = 'ritual_completed' AND NEW.zone_id IS NOT NULL THEN
    DECLARE
      v_ritual_type text;
    BEGIN
      -- Get ritual type from the run
      SELECT ritual_type INTO v_ritual_type
      FROM public.ritual_runs
      WHERE run_id = (NEW.payload->>'run_id')::uuid;

      IF v_ritual_type = 'presence' THEN
        INSERT INTO public.zone_progress (user_id, zone_id, entered, presence_ritual, presence_ritual_at, updated_at)
        VALUES (NEW.user_id, NEW.zone_id, true, true, NEW.ts, now())
        ON CONFLICT (user_id, zone_id) DO UPDATE SET
          entered = true,
          presence_ritual = true,
          presence_ritual_at = COALESCE(zone_progress.presence_ritual_at, EXCLUDED.presence_ritual_at),
          updated_at = now();
      ELSIF v_ritual_type = 'observation' THEN
        INSERT INTO public.zone_progress (user_id, zone_id, entered, observation_ritual, observation_ritual_at, updated_at)
        VALUES (NEW.user_id, NEW.zone_id, true, true, NEW.ts, now())
        ON CONFLICT (user_id, zone_id) DO UPDATE SET
          entered = true,
          observation_ritual = true,
          observation_ritual_at = COALESCE(zone_progress.observation_ritual_at, EXCLUDED.observation_ritual_at),
          updated_at = now();
      END IF;
    END;
  END IF;

  -- engraving_created → mark engraved
  IF NEW.event_type = 'engraving_created' AND NEW.zone_id IS NOT NULL THEN
    INSERT INTO public.zone_progress (user_id, zone_id, entered, engraved, engraved_at, updated_at)
    VALUES (NEW.user_id, NEW.zone_id, true, true, NEW.ts, now())
    ON CONFLICT (user_id, zone_id) DO UPDATE SET
      entered = true,
      engraved = true,
      engraved_at = COALESCE(zone_progress.engraved_at, EXCLUDED.engraved_at),
      updated_at = now();
  END IF;

  -- custody_claimed → mark custodian
  IF NEW.event_type = 'custody_claimed' AND NEW.zone_id IS NOT NULL THEN
    -- Remove custodian from previous holder
    UPDATE public.zone_progress
    SET is_custodian = false, updated_at = now()
    WHERE zone_id = NEW.zone_id AND is_custodian = true AND user_id != NEW.user_id;

    INSERT INTO public.zone_progress (user_id, zone_id, entered, is_custodian, custodian_since, updated_at)
    VALUES (NEW.user_id, NEW.zone_id, true, true, NEW.ts, now())
    ON CONFLICT (user_id, zone_id) DO UPDATE SET
      entered = true,
      is_custodian = true,
      custodian_since = COALESCE(zone_progress.custodian_since, EXCLUDED.custodian_since),
      updated_at = now();
  END IF;

  -- Update complexion points
  IF NEW.event_type = 'ritual_completed' THEN
    INSERT INTO public.user_complexion (user_id, presence_points, completed_rituals_count, updated_at)
    VALUES (NEW.user_id, 10, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      presence_points = user_complexion.presence_points + 10,
      completed_rituals_count = user_complexion.completed_rituals_count + 1,
      updated_at = now();

    INSERT INTO public.complexion_deltas (user_id, event_id, d_presence, reason, created_at)
    VALUES (NEW.user_id, NEW.event_id, 10, 'ritual_completed', now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.event_type = 'engraving_created' THEN
    INSERT INTO public.user_complexion (user_id, wisdom_points, updated_at)
    VALUES (NEW.user_id, 15, now())
    ON CONFLICT (user_id) DO UPDATE SET
      wisdom_points = user_complexion.wisdom_points + 15,
      updated_at = now();

    INSERT INTO public.complexion_deltas (user_id, event_id, d_wisdom, reason, created_at)
    VALUES (NEW.user_id, NEW.event_id, 15, 'engraving_created', now())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to arche_events
DROP TRIGGER IF EXISTS trg_update_zone_progress ON public.arche_events;
CREATE TRIGGER trg_update_zone_progress
  AFTER INSERT ON public.arche_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_zone_progress();
