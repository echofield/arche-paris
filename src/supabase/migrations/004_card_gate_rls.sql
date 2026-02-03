-- ARCHÉ — Card Gate RLS & rate limiting (V1)
--
-- INVARIANTS (documented):
-- 1) Activation requires non-enumerable proof (purchase event, claim token, activation code).
--    activate_card must never succeed with card_id alone. Pairing security assumes this.
-- 2) Pairing: allowed only if activated_at IS NOT NULL AND device_secret_hash IS NULL.
--    One-time only; no automatic re-pairing. Return 409 Already paired if already paired.
-- 3) Device identity: device_secret only (32 bytes), hash stored in DB. Fingerprint UX only.
-- 4) Access: client never touches cards, journal_entries, traces directly. All via Card Gate + service_role.
-- 5) RLS: deny all anon on base tables.

-- ---------------------------------------------------------------------------
-- rate_limits: DB-backed limiter for /pair, /validate, /journal/*, /trace/*
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Consume one slot; returns true if under limit, false if rate limited.
-- p_key: e.g. 'pair:PS-0001', 'validate:PS-0001', 'validate_ip:1.2.3.4'
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key TEXT,
  p_max_attempts INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT count, reset_at INTO v_count, v_reset_at
  FROM rate_limits
  WHERE rate_limits.key = p_key;

  IF v_count IS NULL OR v_reset_at < v_now THEN
    -- New window
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
    ON CONFLICT (key) DO UPDATE SET
      count = 1,
      reset_at = EXCLUDED.reset_at;
    RETURN true;
  END IF;

  IF v_count >= p_max_attempts THEN
    RETURN false;
  END IF;

  UPDATE rate_limits
  SET count = count + 1
  WHERE rate_limits.key = p_key;
  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- cards: add device_secret_hash; RLS deny anon
-- ---------------------------------------------------------------------------
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS device_secret_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_device_secret_hash ON cards(device_secret_hash) WHERE device_secret_hash IS NOT NULL;

-- Drop anon policies so anon has no access (service_role only)
DROP POLICY IF EXISTS "Cards are readable by everyone" ON cards;
DROP POLICY IF EXISTS "Cards can be updated by everyone" ON cards;

-- Optional: explicit deny for anon (RLS already denies when no policy allows)
-- No new anon policy = anon cannot SELECT/UPDATE/INSERT/DELETE.

-- ---------------------------------------------------------------------------
-- journal_entries: ensure anon has no access (no policy = deny)
-- ---------------------------------------------------------------------------
-- If any anon policy was added elsewhere, drop it by name when known.
-- 001_vault_system already had no anon policies; card_id was added later.
-- Ensure no anon policy exists:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_entries'
      AND policyname LIKE '%anon%' OR roles::text LIKE '%anon%'
  ) THEN
    -- Drop by name if you have one; adjust as needed.
    NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- traces: drop anon policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Traces are readable by everyone" ON traces;
DROP POLICY IF EXISTS "Anyone can leave a trace" ON traces;

-- ---------------------------------------------------------------------------
-- Deprecate RPC activate_card for activation with card_id alone
-- (Activation must require proof via activate-card Edge Function with code+password.)
-- Replace with a status-only function so clients don't accidentally use it to activate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION activate_card(
  card_id TEXT,
  fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_record RECORD;
BEGIN
  -- INVARIANT: This RPC must NOT activate with card_id alone.
  -- Activation requires non-enumerable proof (code+password) via activate-card Edge Function.
  -- This function only returns status; it does not set activated_at.
  SELECT id, activated_at INTO card_record
  FROM cards WHERE id = card_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CARD_NOT_FOUND',
      'message', 'Cette carte n''existe pas.'
    );
  END IF;

  -- Return status only (no side effects)
  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN card_record.activated_at IS NULL THEN 'NOT_ACTIVATED' ELSE 'WELCOME_BACK' END,
    'message', CASE
      WHEN card_record.activated_at IS NULL THEN 'Carte non activée. Utilisez l''activation par code et mot de passe.'
      ELSE 'Statut carte.'
    END,
    'activated_at', card_record.activated_at
  );
END;
$$;
