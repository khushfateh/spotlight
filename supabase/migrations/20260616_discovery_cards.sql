-- Discovery cards vault
-- Immutable snapshot of every spot: captures spotter rank, momentum score and tier
-- at the exact moment the user spotted the creator.

CREATE TABLE IF NOT EXISTS discovery_cards (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id       UUID        NOT NULL REFERENCES creators(id)   ON DELETE CASCADE,
  spotter_rank     INTEGER     NOT NULL,
  momentum_at_spot INTEGER     NOT NULL DEFAULT 0,
  momentum_tier    TEXT        NOT NULL DEFAULT '',
  spotted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One card per creator per user — idempotent on re-spot
  UNIQUE (user_id, creator_id)
);

CREATE INDEX IF NOT EXISTS discovery_cards_user_id_idx    ON discovery_cards (user_id);
CREATE INDEX IF NOT EXISTS discovery_cards_spotted_at_idx ON discovery_cards (spotted_at DESC);

-- RLS: users can only see and create their own cards; no updates or deletes (immutable record)
ALTER TABLE discovery_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own discovery cards"
  ON discovery_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery cards"
  ON discovery_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
