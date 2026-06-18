-- Move On / Archive: preserve discovery history instead of deleting spots
-- Run this in Supabase SQL editor

ALTER TABLE spots
  ADD COLUMN IF NOT EXISTS spot_status        TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spot_duration_days INTEGER;

CREATE INDEX IF NOT EXISTS spots_user_status_idx ON spots (user_id, spot_status);

-- Store archive moment on discovery card for vault display
ALTER TABLE discovery_cards
  ADD COLUMN IF NOT EXISTS moved_on_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spot_duration_days INTEGER;
