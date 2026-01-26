-- ============================================
-- ARCHÉ — Inscriptions Personnelles
-- Table: user_lieu_cards
--
-- Un lieu peut devenir "à toi" via accumulation
-- d'inscriptions. Chaque inscription = une réponse
-- datée à une question douce.
-- ============================================

-- Create enum for card states
CREATE TYPE user_lieu_card_state AS ENUM ('glimpsed', 'inscribed', 'claimed');

-- Main table
CREATE TABLE IF NOT EXISTS user_lieu_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lieu_id TEXT NOT NULL,
  state user_lieu_card_state NOT NULL DEFAULT 'inscribed',
  inscriptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_touched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One card per user per lieu
  CONSTRAINT unique_user_lieu UNIQUE (user_id, lieu_id)
);

-- Indexes for performance
CREATE INDEX idx_user_lieu_cards_user_id ON user_lieu_cards(user_id);
CREATE INDEX idx_user_lieu_cards_lieu_id ON user_lieu_cards(lieu_id);
CREATE INDEX idx_user_lieu_cards_state ON user_lieu_cards(state);
CREATE INDEX idx_user_lieu_cards_last_touched ON user_lieu_cards(last_touched DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- Seul l'utilisateur peut voir/modifier ses cartes
-- ============================================

ALTER TABLE user_lieu_cards ENABLE ROW LEVEL SECURITY;

-- SELECT: only own cards
CREATE POLICY "Users can view their own lieu cards"
  ON user_lieu_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: only for self
CREATE POLICY "Users can create their own lieu cards"
  ON user_lieu_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only own cards
CREATE POLICY "Users can update their own lieu cards"
  ON user_lieu_cards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only own cards (optional, for data cleanup)
CREATE POLICY "Users can delete their own lieu cards"
  ON user_lieu_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS (documentation)
-- ============================================

COMMENT ON TABLE user_lieu_cards IS 'Inscriptions personnelles des marcheurs sur les lieux';
COMMENT ON COLUMN user_lieu_cards.state IS 'glimpsed=vu, inscribed=au moins 1 inscription, claimed=3+ inscriptions';
COMMENT ON COLUMN user_lieu_cards.inscriptions IS 'Array JSON des inscriptions: [{id, layer, prompt_id, text, created_at, meta}]';
COMMENT ON COLUMN user_lieu_cards.last_touched IS 'Dernière interaction (inscription ou consultation)';

-- ============================================
-- INSCRIPTIONS JSONB STRUCTURE
-- ============================================
-- Each inscription in the array:
-- {
--   "id": "nanoid-string",
--   "layer": "perception|memory|projection|question|echo",
--   "prompt_id": "lieu-v1-perception",
--   "text": "string",
--   "created_at": "ISO-8601",
--   "meta": {
--     "fallback_used": true/false,
--     "source": "user"
--   }
-- }
