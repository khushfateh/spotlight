-- Artist request system
-- Users can submit artists for the team to review and add to SPOTLIGHT.
-- Once 5 unique accounts request the same artist, the team is notified.
-- Founding requester gets a permanent badge on their vault card.

CREATE TABLE IF NOT EXISTS artist_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email  TEXT        NOT NULL,
  artist_name      TEXT        NOT NULL,
  genre            TEXT,
  country          TEXT,
  spotify_url      TEXT,
  instagram_handle TEXT,
  youtube_url      TEXT,
  reason           TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT artist_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT artist_requests_unique_per_user UNIQUE (requested_by, lower(artist_name))
);

CREATE INDEX IF NOT EXISTS artist_requests_name_idx    ON artist_requests (lower(artist_name));
CREATE INDEX IF NOT EXISTS artist_requests_user_idx    ON artist_requests (requested_by);
CREATE INDEX IF NOT EXISTS artist_requests_status_idx  ON artist_requests (status);

ALTER TABLE artist_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit artist requests"
  ON artist_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can read own requests"
  ON artist_requests FOR SELECT
  USING (auth.uid() = requested_by);

-- Founding requester on creators — the first person who requested this artist
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS founding_requester_id UUID REFERENCES auth.users(id);

-- Founding spot on discovery cards — permanent record when founding requester spots the artist
ALTER TABLE discovery_cards
  ADD COLUMN IF NOT EXISTS is_founding_spot BOOLEAN NOT NULL DEFAULT false;
