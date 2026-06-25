-- =============================================================================
-- 20260625_momentum_signal_tables.sql
-- Momentum Score V2 — community-driven signal tables
-- =============================================================================

-- creator_views: unique profile views (one row per view event, dedup by user+day in queries)
CREATE TABLE IF NOT EXISTS creator_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- for anon users
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_views_creator ON creator_views (creator_id, viewed_at DESC);
ALTER TABLE creator_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_views_insert" ON creator_views FOR INSERT WITH CHECK (true);
CREATE POLICY "creator_views_select" ON creator_views FOR SELECT USING (true);

-- creator_searches: explicit search intent
CREATE TABLE IF NOT EXISTS creator_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  query TEXT,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_searches_creator ON creator_searches (creator_id, searched_at DESC);
ALTER TABLE creator_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_searches_insert" ON creator_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "creator_searches_select" ON creator_searches FOR SELECT USING (true);

-- creator_pulse_votes: community voting (one active vote per user per creator)
CREATE TABLE IF NOT EXISTS creator_pulse_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('will_break_out', 'needs_more_time', 'already_peaking', 'under_the_radar')),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, creator_id)
);
CREATE INDEX IF NOT EXISTS idx_pulse_votes_creator ON creator_pulse_votes (creator_id);
ALTER TABLE creator_pulse_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pulse_votes_select" ON creator_pulse_votes FOR SELECT USING (true);
CREATE POLICY "pulse_votes_insert" ON creator_pulse_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pulse_votes_update" ON creator_pulse_votes FOR UPDATE USING (auth.uid() = user_id);

-- discovery_notes: notes written during Spot
CREATE TABLE IF NOT EXISTS discovery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discovery_notes_creator ON discovery_notes (creator_id, created_at DESC);
ALTER TABLE discovery_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discovery_notes_insert" ON discovery_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discovery_notes_select" ON discovery_notes FOR SELECT USING (true);

-- creator_daily_metrics: daily aggregated snapshot for trend graphs and breakout detection
CREATE TABLE IF NOT EXISTS creator_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spot_count INTEGER NOT NULL DEFAULT 0,
  new_spots INTEGER NOT NULL DEFAULT 0,
  spot_velocity NUMERIC(6,3) NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0,
  rediscoveries INTEGER NOT NULL DEFAULT 0,
  pulse_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  notes_count INTEGER NOT NULL DEFAULT 0,
  momentum_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  spotlight_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_creator ON creator_daily_metrics (creator_id, date DESC);
ALTER TABLE creator_daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_metrics_select" ON creator_daily_metrics FOR SELECT USING (true);
