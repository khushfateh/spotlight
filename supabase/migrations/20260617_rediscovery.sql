-- 20260617_rediscovery.sql
-- Signature Rediscovery Experience: extend discovery_cards + new spot_chapters table

-- Extend discovery_cards with rediscovery tracking fields
ALTER TABLE discovery_cards
  ADD COLUMN IF NOT EXISTS first_spotted_at   TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_moved_on_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_respotted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spot_status         TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS rediscovery_count   INTEGER     NOT NULL DEFAULT 0;

-- Backfill: first_spotted_at from spotted_at (never changes after initial spot)
UPDATE discovery_cards
  SET first_spotted_at = spotted_at
  WHERE first_spotted_at IS NULL AND spotted_at IS NOT NULL;

-- Backfill: mark rows as archived + set first_moved_on_at for rows that have moved_on_at
UPDATE discovery_cards
  SET spot_status = 'archived',
      first_moved_on_at = moved_on_at
  WHERE moved_on_at IS NOT NULL AND spot_status = 'active';

-- discovery_chapters: permanent history of each spot/rediscovery chapter
CREATE TABLE IF NOT EXISTS spot_chapters (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id       UUID        NOT NULL REFERENCES creators(id)   ON DELETE CASCADE,
  chapter_number   INTEGER     NOT NULL DEFAULT 1,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  duration_days    INTEGER,
  event_type       TEXT        NOT NULL DEFAULT 'initial', -- 'initial' | 'rediscovery'
  spotter_rank     INTEGER,
  momentum_at_spot INTEGER     NOT NULL DEFAULT 0,
  momentum_tier    TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE spot_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chapters"
  ON spot_chapters FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chapters"
  ON spot_chapters FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapters"
  ON spot_chapters FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Backfill chapter 1 from existing discovery_cards
INSERT INTO spot_chapters
  (user_id, creator_id, chapter_number, started_at, ended_at, duration_days,
   event_type, spotter_rank, momentum_at_spot, momentum_tier)
SELECT
  dc.user_id,
  dc.creator_id,
  1                   AS chapter_number,
  dc.spotted_at       AS started_at,
  dc.moved_on_at      AS ended_at,
  dc.spot_duration_days AS duration_days,
  'initial'           AS event_type,
  dc.spotter_rank,
  dc.momentum_at_spot,
  dc.momentum_tier
FROM discovery_cards dc
WHERE dc.spotted_at IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable realtime on spot_chapters (if not already publishing all tables)
ALTER PUBLICATION supabase_realtime ADD TABLE spot_chapters;

-- Ensure discovery_cards has UPDATE policy (required for archiveSpot + rediscoverSpot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'discovery_cards'
      AND policyname = 'Users can update their own discovery cards'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own discovery cards"
      ON discovery_cards FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END$$;
