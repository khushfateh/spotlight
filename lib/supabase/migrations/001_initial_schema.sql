-- ════════════════════════════════════════════════════════════════════════
-- SPOTLIGHT — Initial Schema v1
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ════════════════════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  full_name text,
  display_name text,
  bio text,
  avatar_url text,
  cover_color text NOT NULL DEFAULT 'from-purple-600 to-indigo-600',
  discovery_score integer NOT NULL DEFAULT 0,
  creators_spotted integer NOT NULL DEFAULT 0,
  breakouts_identified integer NOT NULL DEFAULT 0,
  avg_lead_days integer NOT NULL DEFAULT 0,
  momentum_accuracy integer NOT NULL DEFAULT 0,
  discovery_rank text NOT NULL DEFAULT 'Newcomer',
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── GENRES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── USER PREFERENCES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, genre_id)
);

-- ── CREATORS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ticker text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'music',
  image_url text,
  bio text,
  momentum_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── CREATOR GENRES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creator_genres (
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (creator_id, genre_id)
);

-- ── SPOTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  notes text,
  spotted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, creator_id)
);

-- ── FOLLOWS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
  followee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id),
  CONSTRAINT follows_target_check CHECK (
    (creator_id IS NOT NULL AND followee_id IS NULL) OR
    (creator_id IS NULL AND followee_id IS NOT NULL)
  )
);

-- ── USER ACTIVITY ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- profiles: anyone authenticated can read; only own row for write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- genres: public read
CREATE POLICY "genres_select" ON public.genres FOR SELECT USING (true);

-- user_preferences: own data only
CREATE POLICY "user_prefs_select" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_prefs_insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_prefs_delete" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- creators: public read
CREATE POLICY "creators_select" ON public.creators FOR SELECT USING (true);

-- creator_genres: public read
CREATE POLICY "creator_genres_select" ON public.creator_genres FOR SELECT USING (true);

-- spots: own data only
CREATE POLICY "spots_select" ON public.spots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "spots_insert" ON public.spots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spots_delete" ON public.spots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- follows: own data only
CREATE POLICY "follows_select" ON public.follows FOR SELECT TO authenticated USING (auth.uid() = follower_id);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- user_activity: own data only
CREATE POLICY "activity_select" ON public.user_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activity_insert" ON public.user_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
-- SEED: GENRES (60+ genres across 13 categories)
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO public.genres (name, slug, category, description) VALUES
  -- Hip-Hop & Rap
  ('Hip-Hop', 'hip-hop', 'Hip-Hop & Rap', 'The culture that started it all'),
  ('Rap', 'rap', 'Hip-Hop & Rap', 'Lyrical storytelling at its finest'),
  ('Trap', 'trap', 'Hip-Hop & Rap', 'Atlanta''s gift to the world'),
  ('Drill', 'drill', 'Hip-Hop & Rap', 'Raw and unapologetic street narratives'),
  ('Boom Bap', 'boom-bap', 'Hip-Hop & Rap', 'Classic hip-hop with hard-hitting drums'),
  ('Cloud Rap', 'cloud-rap', 'Hip-Hop & Rap', 'Dreamy, atmospheric trap vibes'),
  ('Conscious Rap', 'conscious-rap', 'Hip-Hop & Rap', 'Hip-hop with a message and purpose'),

  -- Pop
  ('Pop', 'pop', 'Pop', 'Global chart-dominating anthems'),
  ('Dance Pop', 'dance-pop', 'Pop', 'Made for the club and the festival'),
  ('Synth Pop', 'synth-pop', 'Pop', '80s-inspired electronic pop'),
  ('Art Pop', 'art-pop', 'Pop', 'Experimental pop pushing boundaries'),
  ('Electropop', 'electropop', 'Pop', 'Where electronic music meets pop sensibility'),
  ('Bedroom Pop', 'bedroom-pop', 'Pop', 'Intimate lo-fi pop made at home'),

  -- R&B & Soul
  ('R&B', 'rnb', 'R&B & Soul', 'Rhythm and blues that moves you'),
  ('Soul', 'soul', 'R&B & Soul', 'Raw emotion and timeless grooves'),
  ('Neo-Soul', 'neo-soul', 'R&B & Soul', 'Modern soul with hip-hop and jazz influences'),
  ('Contemporary R&B', 'contemporary-rnb', 'R&B & Soul', 'Current-day R&B with a polished sound'),
  ('Alternative R&B', 'alt-rnb', 'R&B & Soul', 'Experimental takes on R&B'),

  -- Rock & Alternative
  ('Alternative Rock', 'alt-rock', 'Rock & Alternative', 'Non-conformist rock that breaks the mold'),
  ('Indie Rock', 'indie-rock', 'Rock & Alternative', 'Independent rock on its own terms'),
  ('Pop Rock', 'pop-rock', 'Rock & Alternative', 'Rock hooks meet pop production'),
  ('Emo', 'emo', 'Rock & Alternative', 'Emotion-first rock with edge'),
  ('Post-Punk', 'post-punk', 'Rock & Alternative', 'Dark and angular guitar-driven music'),

  -- Electronic
  ('Electronic', 'electronic', 'Electronic', 'Machine-made music with a soul'),
  ('House', 'house', 'Electronic', 'Four-on-the-floor dance floor energy'),
  ('Techno', 'techno', 'Electronic', 'Industrial precision, relentless rhythm'),
  ('EDM', 'edm', 'Electronic', 'Festival-ready electronic bangers'),
  ('Lo-Fi', 'lo-fi', 'Electronic', 'Chill beats to study and relax to'),
  ('Ambient', 'ambient', 'Electronic', 'Atmospheric soundscapes for the mind'),

  -- Country & Americana
  ('Country', 'country', 'Country & Americana', 'Stories of the heartland'),
  ('Americana', 'americana', 'Country & Americana', 'American roots music in all its forms'),
  ('Folk', 'folk', 'Country & Americana', 'Storytelling through acoustic tradition'),
  ('Country Pop', 'country-pop', 'Country & Americana', 'Country crossover with pop appeal'),

  -- Indie & Singer-Songwriter
  ('Indie Pop', 'indie-pop', 'Indie & Singer-Songwriter', 'Catchy, independent and uncompromising'),
  ('Indie Folk', 'indie-folk', 'Indie & Singer-Songwriter', 'Acoustic emotion with indie sensibility'),
  ('Singer-Songwriter', 'singer-songwriter', 'Indie & Singer-Songwriter', 'One voice, one story, everything'),
  ('Dream Pop', 'dream-pop', 'Indie & Singer-Songwriter', 'Ethereal, reverb-soaked soundscapes'),
  ('Shoegaze', 'shoegaze', 'Indie & Singer-Songwriter', 'Walls of guitar and hazy vocals'),

  -- Latin
  ('Latin Pop', 'latin-pop', 'Latin', 'Global Latin sounds with pop crossover'),
  ('Reggaeton', 'reggaeton', 'Latin', 'Perreo and flow from the Caribbean'),
  ('Latin Trap', 'latin-trap', 'Latin', 'Trap beats meet Latin culture'),
  ('Bachata', 'bachata', 'Latin', 'Dominican rhythm with romantic roots'),
  ('Corridos Tumbados', 'corridos-tumbados', 'Latin', 'Mexican corridos reimagined for Gen Z'),

  -- Afrobeats & African
  ('Afrobeats', 'afrobeats', 'Afrobeats & African', 'West African rhythms taking over the world'),
  ('Afropop', 'afropop', 'Afrobeats & African', 'Polished pan-African pop music'),
  ('Afroswing', 'afroswing', 'Afrobeats & African', 'UK fusion of Afrobeats and grime'),
  ('Amapiano', 'amapiano', 'Afrobeats & African', 'South African log drum house genre'),
  ('Highlife', 'highlife', 'Afrobeats & African', 'Classic West African guitar and brass'),

  -- South Asian
  ('Punjabi Music', 'punjabi-music', 'South Asian', 'Bhangra energy and desi soul'),
  ('Bollywood', 'bollywood', 'South Asian', 'Film music from India''s dream factory'),
  ('Desi Pop', 'desi-pop', 'South Asian', 'Modern South Asian pop crossover'),
  ('Bhangra', 'bhangra', 'South Asian', 'Energetic Punjabi folk-dance music'),
  ('Filmi', 'filmi', 'South Asian', 'Classic Indian film song tradition'),

  -- Asian Music
  ('K-Pop', 'k-pop', 'Asian Music', 'Korean pop phenomenon taking over the world'),
  ('J-Pop', 'j-pop', 'Asian Music', 'Japanese pop with distinct aesthetics'),
  ('C-Pop', 'c-pop', 'Asian Music', 'Mandarin pop spanning Greater China'),
  ('Asian Hip-Hop', 'asian-hip-hop', 'Asian Music', 'Hip-hop by and for Asian artists'),

  -- Global & Cultural
  ('Reggae', 'reggae', 'Global & Cultural', 'Jamaican riddims and positive vibrations'),
  ('Dancehall', 'dancehall', 'Global & Cultural', 'High-energy Jamaican club music'),
  ('World Music', 'world-music', 'Global & Cultural', 'Global sounds beyond Western borders'),
  ('Global Pop', 'global-pop', 'Global & Cultural', 'Music that transcends language and borders')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- SEED: CREATORS (from mock data)
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO public.creators (name, ticker, slug, category, momentum_score) VALUES
  ('AP Dhillon', 'APDHILLON', 'apdhillon', 'music', 87),
  ('MrBeast', 'MRBEAST', 'mrbeast', 'content', 95),
  ('Kai Cenat', 'KAICENAT', 'kaicenat', 'streaming', 91),
  ('IShowSpeed', 'SPEED', 'speed', 'streaming', 88),
  ('Pokimane', 'POKIMANE', 'pokimane', 'gaming', 76),
  ('Lil Nas X', 'LILNASX', 'lilnasx', 'music', 82),
  ('Charli D''Amelio', 'CHARLI', 'charli', 'content', 79),
  ('Sidemen', 'SIDEMEN', 'sidemen', 'content', 85),
  ('CORPSE Husband', 'CORPSE', 'corpse', 'gaming', 73),
  ('Valkyrae', 'VALKYRAE', 'valkyrae', 'gaming', 77),
  ('PewDiePie', 'PDPIE', 'pdpie', 'content', 88),
  ('Dr Disrespect', 'DRDIS', 'drdis', 'gaming', 74),
  ('Shubh', 'SHUBH', 'shubh', 'music', 78),
  ('Karan Aujla', 'KARANAUJLA', 'karanaujla', 'music', 72),
  ('Hanumankind', 'HANUMANKIND', 'hanumankind', 'music', 69),
  ('Doja Cat', 'DOJACAT', 'dojacat', 'music', 88),
  ('Ice Spice', 'ICESPICE', 'icespice', 'music', 76),
  ('Sabrina Carpenter', 'SABRINA', 'sabrina', 'music', 91),
  ('Tyler The Creator', 'TYLERTC', 'tylertc', 'music', 83),
  ('xQc', 'XQC', 'xqc', 'streaming', 79),
  ('Peso Pluma', 'PESOPLUMA', 'pesopluma', 'music', 87),
  ('NewJeans', 'NEWJEANS', 'newjeans', 'music', 85)
ON CONFLICT (ticker) DO NOTHING;
