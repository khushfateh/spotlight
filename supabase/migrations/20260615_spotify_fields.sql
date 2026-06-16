-- Add Spotify fields to creators table.
-- Run in the Supabase SQL editor or via: supabase db push
--
-- Note: followers/popularity are NOT available via Spotify Client Credentials flow.
-- Columns are included for future use (e.g. scraped data, user-auth flow).

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS spotify_artist_id           TEXT,
  ADD COLUMN IF NOT EXISTS spotify_image_url           TEXT,
  ADD COLUMN IF NOT EXISTS spotify_url                 TEXT,
  ADD COLUMN IF NOT EXISTS spotify_latest_release_date TEXT,
  ADD COLUMN IF NOT EXISTS spotify_last_synced_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spotify_followers            INTEGER,
  ADD COLUMN IF NOT EXISTS spotify_popularity           INTEGER;

-- Index for fast lookup when refreshing a specific artist
CREATE INDEX IF NOT EXISTS creators_spotify_artist_id_idx ON creators (spotify_artist_id);
