-- Time-series snapshots of creator stats pulled from Spotify every ~3 hours.
-- Used to calculate momentum (follower change between snapshots).
-- Future: add apple_music_listeners, instagram_followers, etc. as new columns.

CREATE TABLE IF NOT EXISTS creator_stats_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID        REFERENCES creators(id) ON DELETE CASCADE,
  ticker          TEXT        NOT NULL,
  spotify_followers   INTEGER,
  spotify_popularity  INTEGER,
  snapped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup: latest snapshot per artist, and window queries
CREATE INDEX IF NOT EXISTS creator_stats_ticker_time_idx
  ON creator_stats_snapshots (ticker, snapped_at DESC);

ALTER TABLE creator_stats_snapshots ENABLE ROW LEVEL SECURITY;

-- Server-side cron inserts without user session
CREATE POLICY "snapshots_insert" ON creator_stats_snapshots
  FOR INSERT WITH CHECK (true);

-- Public read — momentum is not sensitive data
CREATE POLICY "snapshots_select" ON creator_stats_snapshots
  FOR SELECT USING (true);
