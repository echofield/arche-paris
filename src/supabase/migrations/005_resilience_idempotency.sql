-- ARCHÉ — Resilience Layer: idempotency keys for journal + trace
-- Enables safe retries: same key = dedupe (no duplicate rows).

-- ---------------------------------------------------------------------------
-- journal_entries: optional idempotency_key, unique per card
-- ---------------------------------------------------------------------------
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique per (card_id, idempotency_key); NULL keys ignored (legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_idempotency
  ON journal_entries (card_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- traces: optional idempotency_key, unique per card
-- ---------------------------------------------------------------------------
ALTER TABLE traces
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_traces_idempotency
  ON traces (card_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
