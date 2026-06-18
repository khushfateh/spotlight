-- =============================================================================
-- 20260617_spotter_system.sql
-- Permanent Spotter Number System with full Rediscovery support
-- =============================================================================

-- ── 1. Artist spot counters (atomic, one row per creator) ────────────────────

CREATE TABLE IF NOT EXISTS artist_spot_counters (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID        NOT NULL UNIQUE REFERENCES creators(id) ON DELETE CASCADE,
  next_spotter_number INTEGER     NOT NULL DEFAULT 1,
  total_spotter_count INTEGER     NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE artist_spot_counters ENABLE ROW LEVEL SECURITY;

-- Counters are read-only from client; writes happen via SECURITY DEFINER RPCs
CREATE POLICY "Authenticated users can read counters"
  ON artist_spot_counters FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 2. Canonical user–artist relationship table ──────────────────────────────

CREATE TABLE IF NOT EXISTS user_artist_spots (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id            UUID        NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  spotter_number        INTEGER     NOT NULL,
  first_spotted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_moved_on_at     TIMESTAMPTZ,
  latest_spotted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  latest_moved_on_at    TIMESTAMPTZ,
  is_currently_spotted  BOOLEAN     NOT NULL DEFAULT true,
  has_ever_moved_on     BOOLEAN     NOT NULL DEFAULT false,
  has_rediscovered      BOOLEAN     NOT NULL DEFAULT false,
  rediscovered_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_artist   UNIQUE (user_id, creator_id),
  CONSTRAINT uq_artist_number UNIQUE (creator_id, spotter_number)
);

CREATE INDEX IF NOT EXISTS idx_uas_user_id    ON user_artist_spots (user_id);
CREATE INDEX IF NOT EXISTS idx_uas_creator_id ON user_artist_spots (creator_id);
CREATE INDEX IF NOT EXISTS idx_uas_spotted    ON user_artist_spots (is_currently_spotted);
CREATE INDEX IF NOT EXISTS idx_uas_rediscovered ON user_artist_spots (has_rediscovered);

ALTER TABLE user_artist_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own artist spots"
  ON user_artist_spots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own artist spots"
  ON user_artist_spots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own artist spots"
  ON user_artist_spots FOR UPDATE USING (auth.uid() = user_id);

-- ── 3. Atomic spotter number assignment (SECURITY DEFINER) ───────────────────
-- Uses insert-on-conflict to safely handle concurrent first spots.

CREATE OR REPLACE FUNCTION assign_spotter_number(p_creator_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_number INTEGER;
BEGIN
  -- Try to insert a fresh counter row (first-ever spotter for this creator)
  BEGIN
    INSERT INTO artist_spot_counters (creator_id, next_spotter_number, total_spotter_count)
      VALUES (p_creator_id, 2, 1);
    RETURN 1;                -- this caller is Spotter #1
  EXCEPTION WHEN unique_violation THEN
    NULL;                    -- counter already exists, fall through
  END;

  -- Counter exists — atomically grab the next number
  UPDATE artist_spot_counters
    SET next_spotter_number = next_spotter_number + 1,
        total_spotter_count = total_spotter_count + 1,
        updated_at          = now()
    WHERE creator_id = p_creator_id
    RETURNING next_spotter_number - 1 INTO v_number;

  RETURN v_number;
END;
$$;

-- ── 4. Spot or Rediscover RPC ────────────────────────────────────────────────
-- Handles three cases atomically:
--   • First-time spot  → assigns new spotter number, card_status = 'active'
--   • Already spotted  → idempotent, returns current status
--   • Rediscovery      → restores active status, card_status = 'rediscovered'
-- Also syncs the spots table for realtime subscriptions.

CREATE OR REPLACE FUNCTION spot_or_rediscover(p_user_id UUID, p_creator_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_row         user_artist_spots%ROWTYPE;
  v_num         INTEGER;
  v_status      TEXT;
  v_now         TIMESTAMPTZ := now();
BEGIN
  -- Caller must be the user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the row to serialize concurrent calls for the same user-creator pair
  SELECT * INTO v_row
    FROM user_artist_spots
    WHERE user_id = p_user_id AND creator_id = p_creator_id
    FOR UPDATE;

  IF NOT FOUND THEN
    -- ── FIRST-TIME SPOT ────────────────────────────────────────────────────
    v_num := assign_spotter_number(p_creator_id);

    INSERT INTO user_artist_spots (
      user_id, creator_id, spotter_number,
      first_spotted_at, latest_spotted_at,
      is_currently_spotted, has_ever_moved_on, has_rediscovered
    ) VALUES (
      p_user_id, p_creator_id, v_num,
      v_now, v_now, true, false, false
    );

    -- Sync to spots cache (realtime)
    INSERT INTO spots (user_id, creator_id)
      VALUES (p_user_id, p_creator_id)
      ON CONFLICT (user_id, creator_id) DO NOTHING;

    v_status := 'active';

    -- Analytics
    INSERT INTO user_activity (user_id, activity_type, creator_id, metadata)
      VALUES (p_user_id, 'spot', p_creator_id,
        jsonb_build_object('spotter_number', v_num, 'card_status', v_status));

  ELSIF v_row.is_currently_spotted THEN
    -- ── ALREADY SPOTTED (idempotent) ───────────────────────────────────────
    v_num    := v_row.spotter_number;
    v_status := CASE WHEN v_row.has_rediscovered THEN 'rediscovered' ELSE 'active' END;

  ELSE
    -- ── REDISCOVERY ────────────────────────────────────────────────────────
    v_num := v_row.spotter_number;   -- original number, never changes

    UPDATE user_artist_spots
      SET is_currently_spotted = true,
          latest_spotted_at    = v_now,
          has_rediscovered     = true,
          rediscovered_at      = COALESCE(rediscovered_at, v_now),
          updated_at           = v_now
      WHERE user_id = p_user_id AND creator_id = p_creator_id;

    -- Re-insert into spots cache
    INSERT INTO spots (user_id, creator_id)
      VALUES (p_user_id, p_creator_id)
      ON CONFLICT (user_id, creator_id) DO NOTHING;

    v_status := 'rediscovered';

    -- Analytics
    INSERT INTO user_activity (user_id, activity_type, creator_id, metadata)
      VALUES (p_user_id, 'rediscovered', p_creator_id,
        jsonb_build_object('spotter_number', v_num, 'card_status', v_status));
  END IF;

  RETURN jsonb_build_object('spotter_number', v_num, 'card_status', v_status);
END;
$$;

-- ── 5. Move On RPC ───────────────────────────────────────────────────────────
-- Preserves spotter number. first_moved_on_at is immutable once set.

CREATE OR REPLACE FUNCTION move_on_creator(
  p_user_id       UUID,
  p_creator_id    UUID,
  p_duration_days INTEGER DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_row  user_artist_spots%ROWTYPE;
  v_now  TIMESTAMPTZ := now();
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_row
    FROM user_artist_spots
    WHERE user_id = p_user_id AND creator_id = p_creator_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No spot relationship found';
  END IF;

  IF NOT v_row.is_currently_spotted THEN
    -- Already moved on — idempotent
    RETURN jsonb_build_object(
      'spotter_number', v_row.spotter_number,
      'card_status', 'moved_on'
    );
  END IF;

  UPDATE user_artist_spots
    SET is_currently_spotted = false,
        has_ever_moved_on    = true,
        first_moved_on_at    = COALESCE(first_moved_on_at, v_now),
        latest_moved_on_at   = v_now,
        updated_at           = v_now
    WHERE user_id = p_user_id AND creator_id = p_creator_id;

  -- Remove from spots cache (triggers realtime DELETE)
  DELETE FROM spots WHERE user_id = p_user_id AND creator_id = p_creator_id;

  -- Analytics
  INSERT INTO user_activity (user_id, activity_type, creator_id, metadata)
    VALUES (p_user_id, 'move_on', p_creator_id,
      jsonb_build_object(
        'spotter_number', v_row.spotter_number,
        'card_status', 'moved_on',
        'duration_days', p_duration_days
      ));

  RETURN jsonb_build_object(
    'spotter_number', v_row.spotter_number,
    'card_status', 'moved_on'
  );
END;
$$;

-- ── 6. Backfill from discovery_cards ────────────────────────────────────────
-- Assigns sequential spotter numbers based on earliest spot date per creator.

WITH ordered AS (
  SELECT
    dc.user_id,
    dc.creator_id,
    dc.spotted_at,
    dc.spot_status,
    dc.moved_on_at,
    dc.first_moved_on_at,
    dc.latest_respotted_at,
    dc.rediscovery_count,
    ROW_NUMBER() OVER (
      PARTITION BY dc.creator_id
      ORDER BY dc.spotted_at ASC, dc.id ASC
    ) AS new_spotter_number
  FROM discovery_cards dc
)
INSERT INTO user_artist_spots (
  user_id, creator_id, spotter_number,
  first_spotted_at, latest_spotted_at,
  is_currently_spotted, has_ever_moved_on,
  first_moved_on_at, latest_moved_on_at,
  has_rediscovered, rediscovered_at
)
SELECT
  o.user_id,
  o.creator_id,
  o.new_spotter_number,
  o.spotted_at,
  COALESCE(o.latest_respotted_at, o.spotted_at),
  (o.spot_status = 'active'),
  (o.moved_on_at IS NOT NULL),
  o.first_moved_on_at,
  o.moved_on_at,
  (o.rediscovery_count > 0),
  o.latest_respotted_at
FROM ordered o
ON CONFLICT (user_id, creator_id) DO NOTHING;

-- Backfill artist counters from the newly populated user_artist_spots
INSERT INTO artist_spot_counters (creator_id, next_spotter_number, total_spotter_count)
SELECT
  creator_id,
  MAX(spotter_number) + 1 AS next_spotter_number,
  COUNT(*)                AS total_spotter_count
FROM user_artist_spots
GROUP BY creator_id
ON CONFLICT (creator_id) DO UPDATE
  SET next_spotter_number = EXCLUDED.next_spotter_number,
      total_spotter_count = EXCLUDED.total_spotter_count,
      updated_at          = now();

-- ── 7. Realtime ──────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE user_artist_spots;
ALTER PUBLICATION supabase_realtime ADD TABLE artist_spot_counters;
