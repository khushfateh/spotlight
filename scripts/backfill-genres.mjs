#!/usr/bin/env node
/**
 * backfill-genres.mjs
 *
 * Fetches real Spotify genres for every creator that has a spotify_artist_id,
 * maps them to the platform's genres table (creating new genre rows as needed),
 * and populates creator_genres.
 *
 * Usage:
 *   node scripts/backfill-genres.mjs
 *   node scripts/backfill-genres.mjs --dry-run   # prints plan, writes nothing
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '..')

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnv()

const DRY = process.argv.includes('--dry-run')

// ─── Supabase ─────────────────────────────────────────────────────────────────
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// ─── Spotify ──────────────────────────────────────────────────────────────────
let _token = null
async function getToken() {
  if (_token) return _token
  const id  = process.env.SPOTIFY_CLIENT_ID
  const sec = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !sec) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`Spotify token failed: ${res.status}`)
  const { access_token } = await res.json()
  _token = access_token
  return access_token
}

async function spotifySingleArtist(id, token) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 429) {
    const retry = parseInt(res.headers.get('Retry-After') || '5', 10)
    await new Promise(r => setTimeout(r, retry * 1000))
    return spotifySingleArtist(id, token)
  }
  if (!res.ok) return null
  return res.json()
}

async function spotifyBatchArtists(ids) {
  const token = await getToken()
  // Fetch 10 in parallel, staggered 60ms apart to respect rate limits
  const PARALLEL = 10
  const results = new Array(ids.length).fill(null)
  for (let i = 0; i < ids.length; i += PARALLEL) {
    const chunk = ids.slice(i, i + PARALLEL)
    const fetched = await Promise.all(chunk.map((id, j) =>
      new Promise(r => setTimeout(() => spotifySingleArtist(id, token).then(r), j * 60))
    ))
    for (let j = 0; j < chunk.length; j++) results[i + j] = fetched[j]
  }
  return results
}

// ─── Genre mapping: Spotify label → our slug ─────────────────────────────────
// Spotify returns lowercase genre strings. We map them to our platform's slugs.
// Unmapped genres will be auto-created with an inferred category.
const SPOTIFY_TO_SLUG = {
  // Afrobeats & African
  'afrobeats': 'afrobeats',
  'afropop': 'afropop',
  'afro pop': 'afropop',
  'nigerian pop': 'afropop',
  'afro dancehall': 'afrobeats',
  'afroswing': 'afroswing',
  'afro r&b': 'afroswing',
  'ghanaian pop': 'afropop',
  'ghana hiplife': 'afropop',
  'highlife': 'highlife',
  'south african pop': 'afropop',
  'south african hip hop': 'hip-hop',
  'gqom': 'amapiano',
  'amapiano': 'amapiano',
  'naija pop': 'afropop',
  'afro beats': 'afrobeats',
  'afro soul': 'neo-soul',
  'african music': 'world-music',
  'afrohouse': 'house',
  'fuji': 'world-music',
  'juju music': 'world-music',
  'apala': 'world-music',
  'benga': 'world-music',
  'bongo flava': 'afropop',
  'taarab': 'world-music',
  'mugithi': 'world-music',
  'soukous': 'world-music',
  'congolese rumba': 'world-music',
  'afrorap': 'hip-hop',
  'coupe decale': 'afrobeats',
  'coupé-décalé': 'afrobeats',
  'gbagada': 'afrobeats',
  'afro dancehall': 'dancehall',
  'tanzanian pop': 'afropop',
  'kenyan pop': 'afropop',
  'senegalese pop': 'afropop',
  'mbalax': 'world-music',
  'wolof pop': 'afropop',
  'ethiopian pop': 'afropop',
  'malian pop': 'world-music',
  'wassoulou': 'world-music',
  'griot': 'world-music',
  'ndombolo': 'world-music',
  'azonto': 'afropop',
  'afro naija': 'afropop',
  'afrorave': 'afrobeats',
  'sudanese pop': 'afropop',

  // K-Pop & Asian
  'k-pop': 'k-pop',
  'korean pop': 'k-pop',
  'k-rap': 'asian-hip-hop',
  'korean r&b': 'rnb',
  'korean hip hop': 'asian-hip-hop',
  'k-indie': 'indie-pop',
  'korean ballad': 'k-pop',
  'k-pop girl group': 'k-pop',
  'k-pop boy group': 'k-pop',
  'k-ballad': 'k-pop',
  'trot': 'k-pop',
  'j-pop': 'j-pop',
  'japanese pop': 'j-pop',
  'j-rock': 'indie-rock',
  'j-indie': 'indie-pop',
  'anime': 'j-pop',
  'visual kei': 'j-pop',
  'city pop': 'j-pop',
  'japanese r&b': 'rnb',
  'j-rap': 'asian-hip-hop',
  'shibuya-kei': 'j-pop',
  'c-pop': 'c-pop',
  'mandopop': 'c-pop',
  'cantopop': 'c-pop',
  'chinese pop': 'c-pop',
  'taiwanese pop': 'c-pop',
  'hong kong pop': 'c-pop',
  'thai pop': 'global-pop',
  'thai hip hop': 'asian-hip-hop',
  'thai indie': 'indie-pop',
  'vietnamese pop': 'global-pop',
  'v-pop': 'global-pop',
  'opm': 'global-pop',
  'p-pop': 'global-pop',
  'pilipino': 'global-pop',
  'philippine pop': 'global-pop',
  'kpop': 'k-pop',
  'indonesian pop': 'global-pop',
  'malaysian pop': 'global-pop',
  'singapore indie': 'indie-pop',
  'mongolian folk': 'world-music',
  'mongolian metal': 'indie-rock',
  'hunnu rock': 'indie-rock',

  // South Asian
  'desi pop': 'desi-pop',
  'indian pop': 'desi-pop',
  'bollywood': 'bollywood',
  'filmi': 'filmi',
  'bhangra': 'bhangra',
  'punjabi pop': 'punjabi-music',
  'punjabi': 'punjabi-music',
  'indian hip hop': 'hip-hop',
  'desi hip hop': 'hip-hop',
  'hindi pop': 'desi-pop',
  'carnatic': 'world-music',
  'hindustani classical': 'world-music',
  'indian classical': 'world-music',
  'ghazal': 'world-music',
  'qawwali': 'world-music',
  'sufi': 'world-music',
  'pakistan pop': 'desi-pop',
  'pakistani pop': 'desi-pop',
  'bengali pop': 'desi-pop',
  'bangladeshi pop': 'desi-pop',
  'nepali pop': 'global-pop',
  'sinhala pop': 'global-pop',
  'sri lankan pop': 'global-pop',

  // Latin
  'reggaeton': 'reggaeton',
  'latin pop': 'latin-pop',
  'latin trap': 'latin-trap',
  'trap latino': 'latin-trap',
  'latin hip hop': 'latin-trap',
  'latin': 'latin-pop',
  'salsa': 'world-music',
  'bachata': 'bachata',
  'merengue': 'world-music',
  'cumbia': 'world-music',
  'tropical': 'world-music',
  'banda': 'world-music',
  'norteño': 'world-music',
  'corridos tumbados': 'corridos-tumbados',
  'corrido': 'corridos-tumbados',
  'corridos': 'corridos-tumbados',
  'musica mexicana': 'world-music',
  'mexican pop': 'latin-pop',
  'colombian pop': 'latin-pop',
  'champeta': 'world-music',
  'vallenato': 'world-music',
  'bossa nova': 'world-music',
  'mpb': 'world-music',
  'sertanejo': 'world-music',
  'axé': 'world-music',
  'forró': 'world-music',
  'baile funk': 'electronic',
  'funk carioca': 'electronic',
  'pagode': 'world-music',
  'samba': 'world-music',
  'tango': 'world-music',
  'nueva cumbia': 'world-music',
  'urbano latino': 'reggaeton',
  'urbano': 'reggaeton',
  'dembow': 'reggaeton',
  'perreo': 'reggaeton',
  'guaracha': 'reggaeton',
  'latin alternative': 'latin-pop',
  'latin rock': 'pop-rock',
  'latin jazz': 'world-music',
  'flamenco': 'world-music',
  'bolero': 'world-music',
  'son cubano': 'world-music',
  'timba': 'world-music',
  'haitian music': 'world-music',
  'kompa': 'world-music',
  'zouk': 'world-music',
  'soca': 'world-music',
  'bouyon': 'world-music',
  'chutney': 'world-music',

  // Hip-Hop & Rap
  'hip hop': 'hip-hop',
  'hip-hop': 'hip-hop',
  'rap': 'rap',
  'trap': 'trap',
  'trap music': 'trap',
  'dirty south rap': 'trap',
  'southern hip hop': 'hip-hop',
  'east coast hip hop': 'hip-hop',
  'west coast hip hop': 'hip-hop',
  'gangsta rap': 'hip-hop',
  'conscious hip hop': 'conscious-rap',
  'conscious rap': 'conscious-rap',
  'boom bap': 'boom-bap',
  'cloud rap': 'cloud-rap',
  'emo rap': 'cloud-rap',
  'melodic rap': 'trap',
  'drill': 'drill',
  'uk drill': 'drill',
  'chicago drill': 'drill',
  'brooklyn drill': 'drill',
  'pop rap': 'rap',
  'country rap': 'rap',
  'crunk': 'hip-hop',
  'chopped and screwed': 'hip-hop',
  'memphis hip hop': 'hip-hop',
  'horrorcore': 'hip-hop',
  'underground hip hop': 'conscious-rap',
  'alternative hip hop': 'conscious-rap',
  'jazz rap': 'conscious-rap',
  'nerdcore': 'hip-hop',
  'hyphy': 'hip-hop',
  'snap music': 'hip-hop',
  'australian hip hop': 'hip-hop',
  'french hip hop': 'hip-hop',
  'german hip hop': 'hip-hop',
  'uk hip hop': 'hip-hop',
  'grime': 'hip-hop',
  'uk rap': 'rap',
  'canadian hip hop': 'hip-hop',
  'alternative rap': 'conscious-rap',

  // R&B & Soul
  'r&b': 'rnb',
  'rnb': 'rnb',
  'soul': 'soul',
  'neo soul': 'neo-soul',
  'neo-soul': 'neo-soul',
  'contemporary r&b': 'contemporary-rnb',
  'alternative r&b': 'alt-rnb',
  'alt r&b': 'alt-rnb',
  'funk': 'soul',
  'quiet storm': 'rnb',
  'new jack swing': 'rnb',
  'gospel': 'soul',
  'motown': 'soul',
  'blues': 'soul',
  'classic soul': 'soul',

  // Pop
  'pop': 'pop',
  'dance pop': 'dance-pop',
  'electropop': 'electropop',
  'synthpop': 'synth-pop',
  'synth-pop': 'synth-pop',
  'synth pop': 'synth-pop',
  'art pop': 'art-pop',
  'indie pop': 'indie-pop',
  'bedroom pop': 'bedroom-pop',
  'power pop': 'pop-rock',
  'bubblegum pop': 'pop',
  'teen pop': 'pop',
  'brit pop': 'indie-rock',
  'britpop': 'indie-rock',
  'gay pop': 'pop',
  'k-ballad': 'pop',
  'j-ballad': 'j-pop',
  'pop soul': 'rnb',

  // Rock & Alternative
  'rock': 'indie-rock',
  'indie rock': 'indie-rock',
  'alternative rock': 'alt-rock',
  'alt-rock': 'alt-rock',
  'alternative': 'alt-rock',
  'punk': 'alt-rock',
  'punk rock': 'alt-rock',
  'post-punk': 'post-punk',
  'emo': 'emo',
  'pop punk': 'emo',
  'pop-punk': 'emo',
  'hard rock': 'alt-rock',
  'heavy metal': 'alt-rock',
  'metal': 'alt-rock',
  'classic rock': 'alt-rock',
  'grunge': 'alt-rock',
  'shoegaze': 'shoegaze',
  'dream pop': 'dream-pop',
  'noise pop': 'alt-rock',
  'post-rock': 'alt-rock',
  'folk rock': 'indie-folk',
  'new wave': 'synth-pop',
  'gothic rock': 'post-punk',
  'darkwave': 'post-punk',
  'aussie rock': 'alt-rock',
  'australian rock': 'alt-rock',
  'new zealand indie': 'indie-rock',

  // Electronic
  'electronic': 'electronic',
  'edm': 'edm',
  'house': 'house',
  'deep house': 'house',
  'tech house': 'house',
  'progressive house': 'house',
  'techno': 'techno',
  'ambient': 'ambient',
  'lo-fi': 'lo-fi',
  'lo fi': 'lo-fi',
  'lofi': 'lo-fi',
  'chillhop': 'lo-fi',
  'drum and bass': 'electronic',
  'dubstep': 'electronic',
  'trance': 'electronic',
  'jungle': 'electronic',
  'uk garage': 'electronic',
  'future bass': 'edm',
  'future house': 'house',
  'tropical house': 'house',
  'nu disco': 'electronic',
  'disco': 'electronic',
  'funk pop': 'electronic',
  'electro': 'electronic',
  'bass music': 'electronic',
  'big room': 'edm',
  'hardstyle': 'edm',
  'complextro': 'edm',
  'moombahton': 'edm',
  'electronic trap': 'edm',

  // Indie & Singer-Songwriter
  'indie': 'indie-pop',
  'indie folk': 'indie-folk',
  'folk': 'folk',
  'singer-songwriter': 'singer-songwriter',
  'singer songwriter': 'singer-songwriter',
  'acoustic': 'singer-songwriter',
  'country folk': 'indie-folk',
  'stomp and holler': 'indie-folk',
  'new americana': 'americana',

  // Country & Americana
  'country': 'country',
  'country pop': 'country-pop',
  'americana': 'americana',
  'bluegrass': 'folk',
  'outlaw country': 'country',
  'alt-country': 'americana',
  'bro-country': 'country',
  'country rock': 'country',

  // Global
  'world': 'world-music',
  'world music': 'world-music',
  'reggae': 'reggae',
  'dancehall': 'dancehall',
  'global pop': 'global-pop',
  'celtic': 'world-music',
  'irish folk': 'folk',
  'arabic pop': 'global-pop',
  'khaleeji': 'global-pop',
  'rai': 'world-music',
  'chaabi': 'world-music',
  'gnawa': 'world-music',
  'turkish pop': 'global-pop',
  'arabesk': 'global-pop',
  'russian pop': 'global-pop',
  'russian hip hop': 'hip-hop',
  'chanson': 'world-music',
  'french pop': 'global-pop',
  'german pop': 'global-pop',
  'schlager': 'global-pop',
  'eurodance': 'edm',
  'italo dance': 'edm',
  'nordisk': 'world-music',
  'scandinavian pop': 'global-pop',
  'swedish pop': 'global-pop',
  'norwegian pop': 'global-pop',
  'danish pop': 'global-pop',
  'finnish pop': 'global-pop',
  'latin alternative': 'latin-pop',
  'sertanejo universitario': 'world-music',
  'georgian folk': 'world-music',
  'armenian pop': 'global-pop',
  'azerbaijani pop': 'global-pop',
  'kazakh pop': 'global-pop',
  'uzbek pop': 'global-pop',
  'celtic rock': 'indie-rock',
  'irish rock': 'indie-rock',
  'polish pop': 'global-pop',
  'czech pop': 'global-pop',
  'balkan': 'world-music',
  'bulgarian pop': 'global-pop',
  'romanian pop': 'global-pop',
  'turbo-folk': 'world-music',
}

// Infer category from a Spotify genre string when creating a new genre row
function inferCategory(spotifyGenre) {
  const g = spotifyGenre.toLowerCase()
  if (/afro|nigeria|ghana|kenya|south african|bongo|benga|naija|tanzanian|senegal|ethiopian|malian|angolan|congolese|soukous|juju|fuji|highlife|mbalax|azonto|gqom/.test(g)) return 'Afrobeats & African'
  if (/k-pop|kpop|korean|j-pop|jpop|japanese|anime|city pop|c-pop|mandopop|cantopop|chinese|taiwanese|hong kong|thai|vietnamese|opm|philipp|indonesian|malaysian|singapore/.test(g)) return 'Asian Music'
  if (/bollywood|filmi|bhangra|punjabi|hindi|desi|indian|carnatic|hindustani|qawwali|sufi|pakistan|bangla|nepali|sinhala|sri lanka/.test(g)) return 'South Asian'
  if (/reggaeton|latin|salsa|bachata|merengue|cumbia|banda|corrido|sertanejo|bossa nova|mpb|tango|zouk|soca|kompa|haitian|baile funk|champeta|vallenato/.test(g)) return 'Latin'
  if (/hip hop|hip-hop|rap|trap|drill|boom bap|grime|drill/.test(g)) return 'Hip-Hop & Rap'
  if (/r&b|rnb|soul|neo soul|gospel|blues|motown/.test(g)) return 'R&B & Soul'
  if (/pop/.test(g)) return 'Pop'
  if (/rock|punk|metal|grunge|shoegaze|alternative|emo|gothic|darkwave|post-punk/.test(g)) return 'Rock & Alternative'
  if (/electronic|edm|house|techno|ambient|lo-fi|lofi|trance|dubstep|drum and bass|disco|eurodance/.test(g)) return 'Electronic'
  if (/indie|folk|singer-songwriter|acoustic/.test(g)) return 'Indie & Singer-Songwriter'
  if (/country|americana|bluegrass/.test(g)) return 'Country & Americana'
  if (/dancehall|reggae/.test(g)) return 'Global & Cultural'
  return 'Global & Cultural'
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎵 SPOTLIGHT Genre Backfill\n')

  // 1. Load all existing genres from DB
  const { data: existingGenres, error: ge } = await admin.from('genres').select('*')
  if (ge) throw new Error(`Failed to load genres: ${ge.message}`)

  const genreBySlug = new Map(existingGenres.map(g => [g.slug, g]))
  console.log(`  Loaded ${existingGenres.length} existing genres`)

  // 2. Load all creators with spotify_artist_id
  const { data: allCreators, error: ce } = await admin
    .from('creators')
    .select('id, name, ticker, spotify_artist_id')
    .not('spotify_artist_id', 'is', null)
    .neq('spotify_artist_id', '')

  if (ce) throw new Error(`Failed to load creators: ${ce.message}`)
  console.log(`  Found ${allCreators.length} creators with Spotify IDs\n`)

  // 3. Also load existing creator_genres to avoid re-inserting
  const { data: existingCG } = await admin.from('creator_genres').select('creator_id, genre_id')
  const existingPairs = new Set((existingCG || []).map(r => `${r.creator_id}:${r.genre_id}`))
  console.log(`  ${existingPairs.size} creator-genre links already exist\n`)

  // 4. Batch fetch Spotify artist data (50 per request)
  const BATCH = 50
  const artistGenreMap = new Map() // creator_id → string[]

  for (let i = 0; i < allCreators.length; i += BATCH) {
    const batch = allCreators.slice(i, i + BATCH)
    const ids = batch.map(c => c.spotify_artist_id)
    process.stdout.write(`  Fetching Spotify batch ${Math.floor(i/BATCH)+1}/${Math.ceil(allCreators.length/BATCH)} (${ids.length} artists)…`)

    try {
      const artists = await spotifyBatchArtists(ids)
      for (let j = 0; j < batch.length; j++) {
        const creator = batch[j]
        const artist  = artists[j]
        if (artist && artist.genres && artist.genres.length > 0) {
          artistGenreMap.set(creator.id, { name: creator.name, genres: artist.genres })
        }
      }
      console.log(` ✓`)
    } catch (err) {
      console.log(` ✗ ${err.message}`)
    }

    // Respect rate limits
    if (i + BATCH < allCreators.length) {
      await new Promise(r => setTimeout(r, 150))
    }
  }

  const withGenres = [...artistGenreMap.values()].filter(v => v.genres.length > 0)
  console.log(`\n  ${withGenres.length} artists returned genres from Spotify`)

  // 5. Collect all unique Spotify genre strings
  const allSpotifyGenres = new Set()
  for (const [, v] of artistGenreMap) {
    for (const g of v.genres) allSpotifyGenres.add(g.toLowerCase())
  }

  // 6. Resolve or create genre rows
  const newGenres = [] // {name, slug, category, description}
  const genreResolution = new Map() // spotifyGenreStr → genre_id

  for (const spotifyGenre of allSpotifyGenres) {
    const mappedSlug = SPOTIFY_TO_SLUG[spotifyGenre]
    if (mappedSlug && genreBySlug.has(mappedSlug)) {
      genreResolution.set(spotifyGenre, genreBySlug.get(mappedSlug).id)
    } else {
      // Create new genre
      const slug = mappedSlug || toSlug(spotifyGenre)
      if (genreBySlug.has(slug)) {
        genreResolution.set(spotifyGenre, genreBySlug.get(slug).id)
      } else {
        const name     = toTitleCase(spotifyGenre)
        const category = inferCategory(spotifyGenre)
        newGenres.push({ name, slug, category, description: '' })
      }
    }
  }

  // Deduplicate new genres by slug
  const uniqueNew = [...new Map(newGenres.map(g => [g.slug, g])).values()]
  console.log(`\n  New genres to create: ${uniqueNew.length}`)
  for (const g of uniqueNew.slice(0, 10)) console.log(`    + ${g.name} (${g.category})`)
  if (uniqueNew.length > 10) console.log(`    … and ${uniqueNew.length - 10} more`)

  if (!DRY && uniqueNew.length > 0) {
    const { data: inserted, error: ie } = await admin
      .from('genres')
      .insert(uniqueNew)
      .select('id, slug')
    if (ie) throw new Error(`Failed to insert new genres: ${ie.message}`)
    for (const g of inserted) {
      genreBySlug.set(g.slug, g)
    }
    console.log(`  ✓ Inserted ${inserted.length} new genres`)
  }

  // Re-resolve any new genres we just inserted
  for (const spotifyGenre of allSpotifyGenres) {
    if (!genreResolution.has(spotifyGenre)) {
      const slug = SPOTIFY_TO_SLUG[spotifyGenre] || toSlug(spotifyGenre)
      const genre = genreBySlug.get(slug)
      if (genre) genreResolution.set(spotifyGenre, genre.id)
    }
  }

  // 7. Build creator_genres insert rows
  const cgRows = []
  let skipped = 0

  for (const [creatorId, { genres }] of artistGenreMap) {
    for (const spotifyGenre of genres) {
      const genreId = genreResolution.get(spotifyGenre.toLowerCase())
      if (!genreId) { skipped++; continue }
      if (existingPairs.has(`${creatorId}:${genreId}`)) continue
      cgRows.push({ creator_id: creatorId, genre_id: genreId })
    }
  }

  // Deduplicate
  const uniqueCGRows = [...new Map(cgRows.map(r => [`${r.creator_id}:${r.genre_id}`, r])).values()]

  console.log(`\n  creator_genres rows to insert: ${uniqueCGRows.length}`)
  if (skipped > 0) console.log(`  Skipped ${skipped} unmapped genre strings`)

  if (DRY) {
    console.log('\n  [DRY RUN] No changes written.\n')
    return
  }

  // Insert in batches of 500
  let totalInserted = 0
  for (let i = 0; i < uniqueCGRows.length; i += 500) {
    const chunk = uniqueCGRows.slice(i, i + 500)
    const { error: cge } = await admin.from('creator_genres').insert(chunk)
    if (cge) {
      console.error(`  ✗ Insert batch ${i} failed: ${cge.message}`)
    } else {
      totalInserted += chunk.length
    }
  }

  console.log(`\n  ✓ Inserted ${totalInserted} creator-genre links`)
  console.log('\n✅ Genre backfill complete!\n')

  // Summary
  const genreCount = new Map()
  for (const row of uniqueCGRows) {
    genreCount.set(row.genre_id, (genreCount.get(row.genre_id) || 0) + 1)
  }
  const top = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([id, count]) => {
      const g = [...genreBySlug.values()].find(g => g.id === id)
      return `${g?.name || id}: ${count} artists`
    })
  console.log('Top genres by artist count:')
  top.forEach(l => console.log('  ' + l))
  console.log('')
}

main().catch(err => { console.error('\n✗ Fatal:', err.message); process.exit(1) })
