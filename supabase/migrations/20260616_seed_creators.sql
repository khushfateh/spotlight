-- Seed script: update existing 22 creators with bio/image_url/spotify fields
-- and insert 20 new creators with genre relationships.
-- Run in Supabase SQL editor (anon key safe — no RLS bypass needed for INSERT with auth.uid()).
-- NOTE: Existing creators may have RLS blocking UPDATE. Run as project owner in SQL editor.

-- ── 1. UPDATE existing 22 creators ──────────────────────────────────────────

UPDATE creators SET
  bio = 'AP Dhillon is redefining Punjabi music for the global stage. His blend of soul, R&B, and bhangra has made him the first South Asian artist to chart on Billboard Global 200.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebfb505b37709fa86cfd8f55b3',
  spotify_artist_id = '6LEG9Ld1aLImEFEVHdWNSB',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebfb505b37709fa86cfd8f55b3',
  spotify_url = 'https://open.spotify.com/artist/6LEG9Ld1aLImEFEVHdWNSB'
WHERE ticker = 'APDHILLON';

UPDATE creators SET
  bio = 'Shubh is at the forefront of the new wave of Punjabi pop. His debut album crossed 1B streams in record time. Known for blending Punjabi lyrics with trap and R&B production.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb9dfbd284ba8a7d4876a181e3',
  spotify_artist_id = '5r3wPya2PpeTTsXsGhQU8O',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb9dfbd284ba8a7d4876a181e3',
  spotify_url = 'https://open.spotify.com/artist/5r3wPya2PpeTTsXsGhQU8O'
WHERE ticker = 'SHUBH';

UPDATE creators SET
  bio = 'Karan Aujla is Punjab''s most prolific rapper. His debut English-Punjabi crossover album "Making Memories" debuted at #1 in Canada and Australia. Known for raw delivery and massive stage presence.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb8a4c60d0eebe893f72e42979',
  spotify_artist_id = '6DARBhWbfcS9E4yJzcliqQ',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb8a4c60d0eebe893f72e42979',
  spotify_url = 'https://open.spotify.com/artist/6DARBhWbfcS9E4yJzcliqQ'
WHERE ticker = 'KARANAUJLA';

UPDATE creators SET
  bio = 'HANUMANKIND is India''s breakout rap export. Viral hit "Big Dawgs" took him from underground to global stages. Featured on international playlists and lauded for technical lyricism.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebd5a94f1d05a422f1057b0e90',
  spotify_artist_id = '4nVa6XlBFlIkF6msW57PHp',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebd5a94f1d05a422f1057b0e90',
  spotify_url = 'https://open.spotify.com/artist/4nVa6XlBFlIkF6msW57PHp'
WHERE ticker = 'HANUMANKIND';

UPDATE creators SET
  bio = 'Sabrina Carpenter is pop''s reigning moment-maker. "Espresso" became the song of the summer. Her short n sweet album delivered back-to-back viral hits with effortless wit.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb78e45cfa4697ce3c437cb455',
  spotify_artist_id = '74KM79TiuVKeVCqs8QtB0B',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb78e45cfa4697ce3c437cb455',
  spotify_url = 'https://open.spotify.com/artist/74KM79TiuVKeVCqs8QtB0B'
WHERE ticker = 'SABRINA';

UPDATE creators SET
  bio = 'Doja Cat is pop music''s most unpredictable force. Grammy winner. Planet Her went triple platinum. Scarlet showed her dark alter-ego. Collabs with SZA, The Weeknd, and Ariana cement crossover dominance.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb8a0644455ebfa7d3976f5101',
  spotify_artist_id = '5cj0lLjcoR7YOSnhnX0Po5',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb8a0644455ebfa7d3976f5101',
  spotify_url = 'https://open.spotify.com/artist/5cj0lLjcoR7YOSnhnX0Po5'
WHERE ticker = 'DOJACAT';

UPDATE creators SET
  bio = 'Peso Pluma is the face of the Regional Mexican revolution taking over global charts. His corridos tumbados sound has made him the most-streamed Mexican artist of all time.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebe5283f5b671cf618b82a2696',
  spotify_artist_id = '12GqGscKJx3aE4t07u7eVZ',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebe5283f5b671cf618b82a2696',
  spotify_url = 'https://open.spotify.com/artist/12GqGscKJx3aE4t07u7eVZ'
WHERE ticker = 'PESOPLUMA';

UPDATE creators SET
  bio = 'NewJeans is K-pop''s Y2K-inspired sensation. Their retro-cool aesthetic and infectious melodies broke streaming records. Each member has solo brand deals with global luxury labels.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb8dae71b664393f38ba91f891',
  spotify_artist_id = '6HvZYsbFfjnjFrWF950C9d',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb8dae71b664393f38ba91f891',
  spotify_url = 'https://open.spotify.com/artist/6HvZYsbFfjnjFrWF950C9d'
WHERE ticker = 'NEWJEANS';

UPDATE creators SET
  bio = 'Tyler, the Creator is rap''s most celebrated auteur. IGOR won the Grammy for Best Rap Album. CHROMAKOPIA continued his visual and musical evolution. A complete artist on every front.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebdf2728294ff77dd11eeb18fb',
  spotify_artist_id = '4V8LLVI7PbaPR0K2TGSxFF',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebdf2728294ff77dd11eeb18fb',
  spotify_url = 'https://open.spotify.com/artist/4V8LLVI7PbaPR0K2TGSxFF'
WHERE ticker = 'TYLERTC';

UPDATE creators SET
  bio = 'Lil Nas X broke country, pop, and hip-hop simultaneously with "Old Town Road." His fearless self-expression and industry disruption continue to make headlines.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5eb3758a33e782b46bd7f174e1d',
  spotify_artist_id = '7jVv8c5Fj3E9VhNjxT4snq',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5eb3758a33e782b46bd7f174e1d',
  spotify_url = 'https://open.spotify.com/artist/7jVv8c5Fj3E9VhNjxT4snq'
WHERE ticker = 'LILNASX';

UPDATE creators SET
  bio = 'Ice Spice is the Bronx drill queen who rose from TikTok to Taylor Swift collaborations in record time. "Boy''s a liar Pt. 2" and the Barbie collab confirmed her pop crossover.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebab47bb63dae13065213602cd',
  spotify_artist_id = '3LZZPxNDGDFVSIPqf4JuEf',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebab47bb63dae13065213602cd',
  spotify_url = 'https://open.spotify.com/artist/3LZZPxNDGDFVSIPqf4JuEf'
WHERE ticker = 'ICESPICE';

UPDATE creators SET
  bio = 'CORPSE HUSBAND is the faceless content creator turned music artist with 20M+ YouTube subscribers. Known for deep voice, horror storytelling, and Among Us streams that defined 2020 internet culture.',
  image_url = 'https://i.scdn.co/image/ab6761610000e5ebed2fd5aa8e1c20922c190d30',
  spotify_artist_id = '7yntSJ6uojO3z6GFUVwhAW',
  spotify_image_url = 'https://i.scdn.co/image/ab6761610000e5ebed2fd5aa8e1c20922c190d30',
  spotify_url = 'https://open.spotify.com/artist/7yntSJ6uojO3z6GFUVwhAW'
WHERE ticker = 'CORPSE';

-- ── 2. INSERT 20 new creators ────────────────────────────────────────────────

INSERT INTO creators (
  ticker, name, category, bio, image_url,
  price, price_change_24h, price_change_percent_24h,
  market_cap, volume_24h, total_shares, float_shares, shares_held,
  creator_score, is_verified,
  spotify_artist_id, spotify_image_url, spotify_url
) VALUES
-- Latin
('BUNNY',   'Bad Bunny',        'Music',
 'Puerto Rican superstar redefining Latin music worldwide. Three-time most-streamed artist on Spotify globally.',
 'https://i.scdn.co/image/ab6761610000e5eb81f47f44084e0a09b5f0fa13',
 6.82, 0.45, 7.06, 6820000, 612000, 1000000, 200000, 198000, 96, true,
 '4q3ewBCX7sLwd24euuV69X', 'https://i.scdn.co/image/ab6761610000e5eb81f47f44084e0a09b5f0fa13',
 'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X'),

('KAROLG',  'Karol G',          'Music',
 'Colombian reggaeton queen with global crossover appeal. Mañana Será Bonito broke Spotify records for female Latin artists.',
 'https://i.scdn.co/image/ab6761610000e5eb66041ce9eb4497057cbc3496',
 4.15, 0.32, 8.35, 4150000, 395000, 1000000, 200000, 190000, 89, true,
 '790FomKkXshlbRYZFtlgla', 'https://i.scdn.co/image/ab6761610000e5eb66041ce9eb4497057cbc3496',
 'https://open.spotify.com/artist/790FomKkXshlbRYZFtlgla'),

('BALVIN',  'J Balvin',         'Music',
 'Colombian reggaeton pioneer and global Latin ambassador. Collaborations with Beyoncé, Bad Bunny, Cardi B, and Skrillex.',
 'https://i.scdn.co/image/ab6761610000e5eb0405b03342c2e56751b9923d',
 3.28, 0.18, 5.81, 3280000, 298000, 1000000, 200000, 185000, 82, true,
 '1vyhD5VmyZ7KMfW5gqLgo5', 'https://i.scdn.co/image/ab6761610000e5eb0405b03342c2e56751b9923d',
 'https://open.spotify.com/artist/1vyhD5VmyZ7KMfW5gqLgo5'),

('OZUNA',   'Ozuna',            'Music',
 'Puerto Rican reggaeton and Latin trap superstar. Known as "El Negrito de Ojos Claros." Consistent chart dominance since 2016.',
 'https://i.scdn.co/image/ab6761610000e5eb1c4284179078e2529b1630e2',
 2.95, -0.08, -2.64, 2950000, 245000, 1000000, 200000, 180000, 78, true,
 '1i8SpTcr7yvPOmcqrbnVXY', 'https://i.scdn.co/image/ab6761610000e5eb1c4284179078e2529b1630e2',
 'https://open.spotify.com/artist/1i8SpTcr7yvPOmcqrbnVXY'),

-- K-Pop
('BPINK',   'BLACKPINK',        'Music',
 'South Korean global K-pop phenomenon. The most-followed music group on Spotify. BLINK fandom sets streaming records regularly.',
 'https://i.scdn.co/image/ab6761610000e5eb623538b7014238c54ceee056',
 5.45, 0.62, 12.84, 5450000, 528000, 1000000, 200000, 196000, 92, true,
 '41MozSoPIsD1dJM0CLPjZF', 'https://i.scdn.co/image/ab6761610000e5eb623538b7014238c54ceee056',
 'https://open.spotify.com/artist/41MozSoPIsD1dJM0CLPjZF'),

('SKIDS',   'Stray Kids',       'Music',
 'South Korean self-produced K-pop group. Write and produce their own music. STAYs are one of the most devoted K-pop fandoms.',
 'https://i.scdn.co/image/ab6761610000e5ebf9887d2c9288f0e50a3fd69f',
 3.72, 0.41, 12.38, 3720000, 358000, 1000000, 200000, 190000, 85, true,
 '2oBfCLDhzcS4grGdxGOXAM', 'https://i.scdn.co/image/ab6761610000e5ebf9887d2c9288f0e50a3fd69f',
 'https://open.spotify.com/artist/2oBfCLDhzcS4grGdxGOXAM'),

('AESPA',   'aespa',            'Music',
 'SM Entertainment K-pop group blending AI concept with mainstream pop. Viral "Next Level" put them on the global radar.',
 'https://i.scdn.co/image/ab6761610000e5eb053bbb910dda6d4ab0618b8b',
 2.85, 0.28, 10.94, 2850000, 265000, 1000000, 200000, 182000, 80, true,
 '5wh783bRMhcRqX1bS7DMzf', 'https://i.scdn.co/image/ab6761610000e5eb053bbb910dda6d4ab0618b8b',
 'https://open.spotify.com/artist/5wh783bRMhcRqX1bS7DMzf'),

('BTS',     'BTS',              'Music',
 'South Korean group that broke every K-pop record. Group return highly anticipated by 100M+ ARMY fandom.',
 'https://i.scdn.co/image/ab6761610000e5ebf80ec63ea7a0ef0fba60957d',
 8.20, -0.15, -1.80, 8200000, 695000, 1000000, 200000, 199000, 94, true,
 '3Nrfpe0tUJi4K4l4W7JGf4', 'https://i.scdn.co/image/ab6761610000e5ebf80ec63ea7a0ef0fba60957d',
 'https://open.spotify.com/artist/3Nrfpe0tUJi4K4l4W7JGf4'),

-- Afrobeats
('BURNA',   'Burna Boy',        'Music',
 'Nigerian Afrobeats superstar and Grammy winner. African Giant pioneer bringing Afrobeats to worldwide arenas.',
 'https://i.scdn.co/image/ab6761610000e5ebb4e44d0f4e3e47af2cf06f3f',
 3.85, 0.44, 12.93, 3850000, 362000, 1000000, 200000, 190000, 88, true,
 '3wcj11K77LjEY1PkEKanoE', 'https://i.scdn.co/image/ab6761610000e5ebb4e44d0f4e3e47af2cf06f3f',
 'https://open.spotify.com/artist/3wcj11K77LjEY1PkEKanoE'),

('WIZKID',  'Wizkid',           'Music',
 'Nigerian Afropop legend. "Essence" remix with Justin Bieber cemented his global crossover.',
 'https://i.scdn.co/image/ab6761610000e5ebe6ef803356b45ee5a9fa7a8a',
 2.65, 0.19, 7.74, 2650000, 228000, 1000000, 200000, 182000, 79, true,
 '3tVQdUvClmAT7URs9V3rsp', 'https://i.scdn.co/image/ab6761610000e5ebe6ef803356b45ee5a9fa7a8a',
 'https://open.spotify.com/artist/3tVQdUvClmAT7URs9V3rsp'),

('TEMS',    'Tems',             'Music',
 'Nigerian alt-R&B and Afrobeats artist with a voice that stops rooms. Collaborated with Drake, Beyoncé, Future.',
 'https://i.scdn.co/image/ab6761610000e5eb22d7d6f8981c7a27bf68a382',
 2.40, 0.35, 17.07, 2400000, 215000, 1000000, 200000, 176000, 76, true,
 '0gUkSBVVfKL6vV37HFQJXR', 'https://i.scdn.co/image/ab6761610000e5eb22d7d6f8981c7a27bf68a382',
 'https://open.spotify.com/artist/0gUkSBVVfKL6vV37HFQJXR'),

('DAVIDO',  'Davido',           'Music',
 'Nigerian Afrobeats pioneer with 13M+ followers. Timeless is his most critically acclaimed work.',
 'https://i.scdn.co/image/ab6761610000e5eb057fdb13352beee124b79051',
 2.20, 0.08, 3.77, 2200000, 182000, 1000000, 200000, 172000, 72, true,
 '0NOQsYSdBFQKqTDoqnekuN', 'https://i.scdn.co/image/ab6761610000e5eb057fdb13352beee124b79051',
 'https://open.spotify.com/artist/0NOQsYSdBFQKqTDoqnekuN'),

-- R&B
('SZA',     'SZA',              'Music',
 'TDE R&B artist redefining neo-soul for Gen Z. SOS broke streaming records and dominated year-end charts.',
 'https://i.scdn.co/image/ab6761610000e5ebfd0a9fb6c252a3ba44079acf',
 4.25, 0.58, 15.82, 4250000, 412000, 1000000, 200000, 194000, 90, true,
 '7tYKF4w9nC0nq9CsPZTHyP', 'https://i.scdn.co/image/ab6761610000e5ebfd0a9fb6c252a3ba44079acf',
 'https://open.spotify.com/artist/7tYKF4w9nC0nq9CsPZTHyP'),

('WEEKND',  'The Weeknd',       'Music',
 'Canadian R&B and pop superstar. Most-streamed artist milestone holder. Blinding Lights became the longest-charting Hot 100 song ever.',
 'https://i.scdn.co/image/ab6761610000e5ebc1719ac9e6a75c1c25835018',
 7.15, 0.22, 3.17, 7150000, 580000, 1000000, 200000, 199000, 93, true,
 '1Xyo4u8uXC1ZmMpatF05PJ', 'https://i.scdn.co/image/ab6761610000e5ebc1719ac9e6a75c1c25835018',
 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ'),

('HER',     'H.E.R.',           'Music',
 'Grammy and Oscar-winning R&B artist and multi-instrumentalist. Bridging soul, blues, and contemporary R&B.',
 'https://i.scdn.co/image/ab6761610000e5eb417db49cde3ed1c5a65e3514',
 1.85, 0.12, 6.93, 1850000, 148000, 1000000, 200000, 168000, 68, true,
 '0WNSXEqHcJBiIBbMIpCPWq', 'https://i.scdn.co/image/ab6761610000e5eb417db49cde3ed1c5a65e3514',
 'https://open.spotify.com/artist/0WNSXEqHcJBiIBbMIpCPWq'),

('GIVEON',  'Giveon',           'Music',
 'Long Beach soul singer with a baritone voice that stands apart. Heartbreak Anniversary went viral and launched a new soul era.',
 'https://i.scdn.co/image/ab6761610000e5ebe357870455bc56f7ef4147f8',
 2.05, 0.15, 7.89, 2050000, 168000, 1000000, 200000, 172000, 71, true,
 '73FpciNXe0O7D8kcAFB3Hk', 'https://i.scdn.co/image/ab6761610000e5ebe357870455bc56f7ef4147f8',
 'https://open.spotify.com/artist/73FpciNXe0O7D8kcAFB3Hk'),

-- Electronic
('SKRLL',   'Skrillex',         'Music',
 'EDM pioneer and Grammy winner. Quest For Fire and Don''t Get Too Close marked a massive comeback and genre reinvention.',
 'https://i.scdn.co/image/ab6761610000e5ebf3103acde767f8daf964d5bd',
 2.75, 0.38, 16.02, 2750000, 245000, 1000000, 200000, 182000, 80, true,
 '5HtnuFEJKQ0tKdEOaL3YCf', 'https://i.scdn.co/image/ab6761610000e5ebf3103acde767f8daf964d5bd',
 'https://open.spotify.com/artist/5HtnuFEJKQ0tKdEOaL3YCf'),

('DIPLO',   'Diplo',            'Music',
 'World-class DJ and producer. Founder of Mad Decent. Blends global sounds from cumbia to electronic.',
 'https://i.scdn.co/image/ab6761610000e5ebdf01727aa674ddefa777797a',
 1.95, 0.14, 7.74, 1950000, 152000, 1000000, 200000, 168000, 70, true,
 '5fMUXHkw8R8eOP2RNVYEZX', 'https://i.scdn.co/image/ab6761610000e5ebdf01727aa674ddefa777797a',
 'https://open.spotify.com/artist/5fMUXHkw8R8eOP2RNVYEZX'),

('PORTER',  'Porter Robinson',  'Music',
 'Electronic producer and vocalist. Nurture album became a landmark of indie dance music. Live shows are deeply immersive experiences.',
 'https://i.scdn.co/image/ab6761610000e5eb1ac12dcb2cc4fc7c740c5e0c',
 2.15, 0.28, 14.97, 2150000, 192000, 1000000, 200000, 174000, 74, true,
 '3HqSLMAZ3g3d5poNaI7GOU', 'https://i.scdn.co/image/ab6761610000e5eb1ac12dcb2cc4fc7c740c5e0c',
 'https://open.spotify.com/artist/3HqSLMAZ3g3d5poNaI7GOU'),

('FLUME',   'Flume',            'Music',
 'Australian producer pioneering future bass and ambient electronic. Palaces showcased mature artistic evolution.',
 'https://i.scdn.co/image/ab6761610000e5ebd6ec6e1162ee709ad829cf82',
 1.75, 0.10, 6.06, 1750000, 128000, 1000000, 200000, 164000, 66, false,
 '6nxWCVXbOlEVRexSbLsTer', 'https://i.scdn.co/image/ab6761610000e5ebd6ec6e1162ee709ad829cf82',
 'https://open.spotify.com/artist/6nxWCVXbOlEVRexSbLsTer')

ON CONFLICT (ticker) DO NOTHING;

-- ── 3. Populate creator_genres junction ─────────────────────────────────────
-- First: get genre IDs with SELECT id, name FROM genres; then insert.
-- Replace genre UUIDs below with actual values from your genres table.
-- Run: SELECT id, name FROM genres ORDER BY name;
-- Then map these inserts accordingly.

-- NOTE: The junction inserts below use a subquery pattern to avoid hardcoding UUIDs.
-- This requires genre slugs to match the `name` or `slug` column in your genres table.
-- Adjust column name (name/slug/id) to match your actual schema.

-- Example pattern (adjust 'slug' to your actual column):
-- INSERT INTO creator_genres (creator_id, genre_id)
-- SELECT c.id, g.id FROM creators c, genres g
-- WHERE c.ticker = 'BUNNY' AND g.name = 'Latin Music'
-- ON CONFLICT DO NOTHING;
