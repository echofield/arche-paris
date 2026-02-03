-- ARCHÉ — Map v1: inscriptions, engraved_segments, meridian_proofs
-- All access via Card Gate (service_role). Anon has no access.
-- Client may only create status='pending'; only server/admin can set verified.

-- ---------------------------------------------------------------------------
-- inscriptions (spec: arrondissement/quest/lieu engraving)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('arrondissement', 'quest', 'lieu')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  arrondissement INTEGER,
  anchor_id TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_inscriptions_card ON inscriptions(card_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_card_status ON inscriptions(card_id, status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_arrondissement_status ON inscriptions(arrondissement, status) WHERE arrondissement IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscriptions_idempotency ON inscriptions(card_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
-- No anon policies: access only via service_role (Card Gate).

-- ---------------------------------------------------------------------------
-- engraved_segments (quest/marche/meridien/tresor lines)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS engraved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('marche', 'meridien', 'tresor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  from_arrondissement INTEGER,
  from_anchor_id TEXT,
  from_lat DOUBLE PRECISION,
  from_lng DOUBLE PRECISION,
  to_arrondissement INTEGER,
  to_anchor_id TEXT,
  to_lat DOUBLE PRECISION,
  to_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_engraved_segments_card ON engraved_segments(card_id);
CREATE INDEX IF NOT EXISTS idx_engraved_segments_card_status ON engraved_segments(card_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_engraved_segments_idempotency ON engraved_segments(card_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE engraved_segments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- meridian_proofs (approx location + answer + personal sentence)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meridian_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  meridian_id TEXT NOT NULL,
  approx_lat DOUBLE PRECISION NOT NULL,
  approx_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL,
  answer TEXT NOT NULL,
  personal_sentence TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified'))
);

CREATE INDEX IF NOT EXISTS idx_meridian_proofs_card ON meridian_proofs(card_id);
CREATE INDEX IF NOT EXISTS idx_meridian_proofs_meridian ON meridian_proofs(meridian_id);

ALTER TABLE meridian_proofs ENABLE ROW LEVEL SECURITY;
