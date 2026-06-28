-- ─────────────────────────────────────────────────────────────────────────────
-- User deletion cleanup
--
-- When a user is deleted (auth.users row removed — either via the app or
-- directly from the Supabase dashboard), this trigger fires BEFORE the row
-- is removed and:
--
--   1. Decrements total_spotter_count on artist_spot_counters for every
--      artist the user had spotted  (next_spotter_number is never changed —
--      spotter badges are permanent ordinals, not a live headcount)
--   2. Deletes all rows the user owns across every table:
--        spots, user_artist_spots, discovery_cards, user_activity,
--        user_preferences, follows, discovery_notes, profiles
--
--   creator_pulse_votes already carries ON DELETE CASCADE so it is handled
--   automatically by Postgres.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Cleanup function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrement spot counters for every artist this user had spotted.
  -- Use GREATEST(0, ...) so the count never goes negative from a race
  -- condition or data inconsistency.
  UPDATE public.artist_spot_counters asc_
  SET
    total_spotter_count = GREATEST(0, asc_.total_spotter_count - 1),
    updated_at          = NOW()
  WHERE asc_.creator_id IN (
    SELECT DISTINCT creator_id
    FROM public.user_artist_spots
    WHERE user_id = OLD.id
  );

  -- Remove all owned rows in dependent tables.
  -- Order matters: spots before user_artist_spots (spots has no FK to it,
  -- but keeping the logical deletion order readable).
  DELETE FROM public.spots               WHERE user_id = OLD.id;
  DELETE FROM public.user_artist_spots   WHERE user_id = OLD.id;
  DELETE FROM public.discovery_cards     WHERE user_id = OLD.id;
  DELETE FROM public.discovery_notes     WHERE user_id = OLD.id;
  DELETE FROM public.user_activity       WHERE user_id = OLD.id;
  DELETE FROM public.user_preferences    WHERE user_id = OLD.id;
  DELETE FROM public.follows             WHERE follower_id = OLD.id;
  DELETE FROM public.profiles            WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

-- ── 2. Trigger on auth.users ─────────────────────────────────────────────────
-- Fires BEFORE DELETE so OLD.id is still valid when the function runs.
-- Using BEFORE (not AFTER) ensures our FK-less cleanup runs before Postgres
-- tries to enforce any remaining constraints.

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();

-- ── 3. Safety: also trigger on profiles for direct profile deletion ───────────
-- Covers the edge case where someone deletes a profiles row directly without
-- going through auth.users (e.g. a manual Supabase Table Editor delete).

CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artist_spot_counters asc_
  SET
    total_spotter_count = GREATEST(0, asc_.total_spotter_count - 1),
    updated_at          = NOW()
  WHERE asc_.creator_id IN (
    SELECT DISTINCT creator_id
    FROM public.user_artist_spots
    WHERE user_id = OLD.id
  );

  DELETE FROM public.spots               WHERE user_id = OLD.id;
  DELETE FROM public.user_artist_spots   WHERE user_id = OLD.id;
  DELETE FROM public.discovery_cards     WHERE user_id = OLD.id;
  DELETE FROM public.discovery_notes     WHERE user_id = OLD.id;
  DELETE FROM public.user_activity       WHERE user_id = OLD.id;
  DELETE FROM public.user_preferences    WHERE user_id = OLD.id;
  DELETE FROM public.follows             WHERE follower_id = OLD.id;

  -- Do NOT delete auth.users here — the profile trigger fires independently
  -- of auth; attempting to delete auth.users from a profile trigger would
  -- cause a foreign-key violation or infinite recursion.

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;

CREATE TRIGGER on_profile_deleted
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deletion();

-- ── 4. Ensure profiles FK cascades from auth.users ───────────────────────────
-- If this FK already exists the statement is a no-op because of IF NOT EXISTS.
-- This ensures that deleting from auth.users also removes the profile row
-- (which in turn fires the on_profile_deleted trigger above — but by that
-- point spot data is already cleaned up by on_auth_user_deleted, so the
-- second trigger's DELETEs are harmless no-ops).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'profiles'
      AND rc.delete_rule = 'CASCADE'
  ) THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT IF EXISTS profiles_id_fkey,
      ADD CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
  END IF;
END;
$$;
