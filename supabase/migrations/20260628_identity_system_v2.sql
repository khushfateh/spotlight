-- ─────────────────────────────────────────────────────────────────────────────
-- Identity System V2
-- Adds username enforcement, avatar storage tracking, and profile completion
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns on profiles ───────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Username uniqueness (case-insensitive) ─────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (LOWER(TRIM(username)))
  WHERE username IS NOT NULL;

-- ── 3. Username format constraint ────────────────────────────────────────────
-- 3–20 chars, lowercase letters/digits/underscores,
-- must start and end with a letter or digit (no leading/trailing underscores),
-- no consecutive underscores

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS username_format CHECK (
    username IS NULL
    OR (
      LENGTH(username) BETWEEN 3 AND 20
      AND username ~ '^[a-z0-9]([a-z0-9_]*[a-z0-9])?$'
      AND username !~ '__'
    )
  );

-- ── 4. Avatars storage bucket ─────────────────────────────────────────────────
-- Public bucket — avatar URLs are embedded in profile cards visible to all users.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Storage RLS policies ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "avatar_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "avatar_owner_insert"   ON storage.objects;
DROP POLICY IF EXISTS "avatar_owner_update"   ON storage.objects;
DROP POLICY IF EXISTS "avatar_owner_delete"   ON storage.objects;

CREATE POLICY "avatar_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatar_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
