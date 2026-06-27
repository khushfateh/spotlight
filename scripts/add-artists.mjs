#!/usr/bin/env node
/**
 * add-artists.mjs
 *
 * Add brand-new artists to SPOTLIGHT — fully wired end-to-end:
 *   1. Inserts into `creators` table (Supabase)
 *   2. Inserts into `artist_spot_counters` (spotter ranking ready immediately)
 *   3. Appends a complete Creator object to lib/mock-data/creators.ts (what the UI renders from)
 *   4. Updates lib/spotify/artist-map.ts with the ticker → Spotify ID mapping
 *
 * Usage:
 *   node scripts/add-artists.mjs --names "Billie Eilish, Olivia Rodrigo, Gracie Abrams"
 *   node scripts/add-artists.mjs --file scripts/new-artists.json
 *
 * JSON file format (all fields except `name` are optional):
 * [
 *   {
 *     "name": "Billie Eilish",
 *     "ticker": "BILLIE",
 *     "category": "Music",
 *     "spotify_id": "6qqNVTkY8uBg9cP3Jd7DAH",
 *     "bio": "Custom bio — if omitted, left blank"
 *   }
 * ]
 *
 * Env (auto-read from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY  — required
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET        — optional (enables auto image/follower sync)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '..')

// ─── Load .env.local ───────────────────────────────────────────────────────

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

// ─── Arg parsing ───────────────────────────────────────────────────────────

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const namesRaw = arg('--names')
const fileArg  = arg('--file')

if (!namesRaw && !fileArg) {
  console.error([
    '',
    '  Usage:',
    '    node scripts/add-artists.mjs --names "Billie Eilish, Olivia Rodrigo"',
    '    node scripts/add-artists.mjs --file scripts/new-artists.json',
    '',
  ].join('\n'))
  process.exit(1)
}

let inputs = fileArg
  ? JSON.parse(readFileSync(resolve(process.cwd(), fileArg), 'utf8'))
  : namesRaw.split(',').map(n => ({ name: n.trim() })).filter(a => a.name)

// ─── Supabase admin client ─────────────────────────────────────────────────

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SECRET_KEY

if (!supaUrl || !supaKey) {
  console.error('  Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be in .env.local')
  process.exit(1)
}

const admin = createClient(supaUrl, supaKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Spotify helpers ───────────────────────────────────────────────────────

let _spotifyToken = null

async function getSpotifyToken() {
  if (_spotifyToken) return _spotifyToken
  const id  = process.env.SPOTIFY_CLIENT_ID
  const sec = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !sec) return null
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) return null
  const { access_token } = await res.json()
  _spotifyToken = access_token
  return access_token
}

async function spotifyGet(path) {
  const token = await getSpotifyToken()
  if (!token) return null
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok ? res.json() : null
}

async function lookupSpotifyById(id)  { return spotifyGet(`/artists/${id.trim()}`) }
async function searchSpotify(name)    {
  const data = await spotifyGet(`/search?q=${encodeURIComponent(name)}&type=artist&limit=1`)
  return data?.artists?.items?.[0] ?? null
}
async function getLatestRelease(id)   {
  const data = await spotifyGet(`/artists/${id}/albums?include_groups=album,single&market=US&limit=1`)
  return data?.items?.[0]?.release_date ?? null
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function toTicker(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
}

function toSlug(ticker) { return ticker.toLowerCase() }

function toAvatar(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatFollowers(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// Deterministic cover color from ticker hash
const COVER_COLORS = [
  'from-purple-600 to-pink-600',
  'from-yellow-400 to-orange-500',
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-red-500 to-pink-600',
  'from-violet-600 to-purple-800',
  'from-amber-400 to-yellow-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-700',
  'from-green-500 to-emerald-700',
  'from-fuchsia-500 to-violet-600',
  'from-sky-500 to-cyan-600',
]

function pickColor(ticker) {
  const hash = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0)
  return COVER_COLORS[hash % COVER_COLORS.length]
}

// Starting price: loosely tied to Spotify popularity (0–100 → $0.50–$6.00)
function derivePrice(popularity) {
  if (!popularity) return 1.00
  return Math.round(((popularity / 100) * 5.5 + 0.5) * 100) / 100
}

// Creator score from Spotify popularity (normalized to ~40–95)
function deriveScore(popularity) {
  if (!popularity) return 50
  return Math.min(95, Math.round(popularity * 0.55 + 40))
}

// ─── Write to lib/mock-data/creators.ts ───────────────────────────────────

function buildCreatorBlock(c) {
  const startPrice = Math.max(0.50, c.price - c.price * 0.3).toFixed(2)
  const trend      = c.price >= 2.00 ? 'up' : 'volatile'

  const socialLines = []
  if (c.name)        socialLines.push(`      spotify: '${c.name}',`)
  const socialBlock = socialLines.length
    ? `{\n${socialLines.join('\n')}\n    }`
    : '{}'

  const monthlyListeners = c.spotify_followers
    ? formatFollowers(Math.round(c.spotify_followers * 0.6))
    : null

  const revLines = [
    monthlyListeners ? `      monthlyListeners: '${monthlyListeners}',` : null,
  ].filter(Boolean)
  const revBlock = revLines.length ? `{\n${revLines.join('\n')}\n    }` : '{}'

  const lines = [
    `  {`,
    `    id: '${c.slug}',`,
    `    ticker: '${c.ticker}',`,
    `    name: '${c.name.replace(/'/g, "\\'")}',`,
    `    category: '${c.category}',`,
    `    bio: '${(c.bio ?? '').replace(/'/g, "\\'")}',`,
    `    avatar: '${c.avatar}',`,
    `    coverColor: '${c.coverColor}',`,
    `    status: 'active',`,
    `    price: ${c.price},`,
    `    priceChange24h: 0,`,
    `    priceChangePercent24h: 0,`,
    `    marketCap: ${Math.round(c.price * 1_000_000)},`,
    `    volume24h: ${Math.round(c.price * 70_000)},`,
    `    totalShares: 1000000,`,
    `    floatShares: 200000,`,
    `    sharesHeld: 100000,`,
    `    followers: '${formatFollowers(c.spotify_followers)}',`,
    `    creatorScore: ${c.creatorScore},`,
    `    socialHandles: ${socialBlock},`,
    `    revenueMetrics: ${revBlock},`,
    `    priceHistory: generatePriceHistory(${startPrice}, 90, '${trend}', ${c.price}),`,
    `    isVerified: false,`,
    c.imageUrl ? `    imageUrl: '${c.imageUrl}',` : null,
    `  },`,
  ].filter(l => l !== null)

  return lines.join('\n')
}

function insertIntoMockData(blocks) {
  const filePath = resolve(root, 'lib/mock-data/creators.ts')
  if (!existsSync(filePath)) return false

  let src = readFileSync(filePath, 'utf8')

  // Find the closing `]` of the creators array (last occurrence before the export functions)
  const marker = '\n]'
  const insertPos = src.lastIndexOf(marker)
  if (insertPos === -1) return false

  const insertion = '\n' + blocks.join('\n') + '\n'
  src = src.slice(0, insertPos) + insertion + src.slice(insertPos)

  writeFileSync(filePath, src, 'utf8')
  return true
}

// ─── Update lib/spotify/artist-map.ts ─────────────────────────────────────

function updateArtistMap(entries) {
  const mapPath = resolve(root, 'lib/spotify/artist-map.ts')
  if (!existsSync(mapPath)) return false

  let src = readFileSync(mapPath, 'utf8')
  const newLines = entries
    .filter(e => e.spotify_id)
    .map(e => `  ${e.ticker.padEnd(12)} '${e.spotify_id}',`)
    .join('\n')

  if (!newLines) return false
  src = src.replace(/(\n}\s*$)/, `\n  // Added via add-artists script\n${newLines}\n$1`)
  writeFileSync(mapPath, src, 'utf8')
  return true
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎵 SPOTLIGHT — Add Artists')
  console.log('─'.repeat(44))

  const hasSpotify = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
  if (!hasSpotify) {
    console.log('  ⚠  SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set')
    console.log('     Artists will be created without image/followers/popularity.\n')
  }

  const results    = []
  const mockBlocks = []
  const mapEntries = []

  for (const input of inputs) {
    const displayName = input.name
    console.log(`\n  ▸ ${displayName}`)

    const ticker = (input.ticker ?? toTicker(displayName)).toUpperCase()
    const slug   = toSlug(ticker)

    // ── Check for existing ticker in mock data ──
    const mockDataSrc = readFileSync(resolve(root, 'lib/mock-data/creators.ts'), 'utf8')
    if (mockDataSrc.includes(`ticker: '${ticker}'`)) {
      console.log(`     ⚠  Ticker $${ticker} already exists in mock data — skipping`)
      results.push({ name: displayName, ticker, ok: false, reason: 'already exists' })
      continue
    }

    // ── Spotify lookup ──
    let spotify   = null
    let spotifyId = input.spotify_id?.trim() ?? null

    if (hasSpotify) {
      if (spotifyId) {
        process.stdout.write(`     Spotify by ID… `)
        spotify = await lookupSpotifyById(spotifyId)
      } else {
        process.stdout.write(`     Spotify search "${displayName}"… `)
        spotify = await searchSpotify(displayName)
        if (spotify) spotifyId = spotify.id
      }
      console.log(spotify ? `✓ found "${spotify.name}"` : '✗ not found')
    }

    let latestRelease = null
    if (spotify?.id) latestRelease = await getLatestRelease(spotify.id)

    // ── Build unified creator data ──
    const category      = input.category ?? 'Music'
    const imageUrl      = spotify?.images?.[0]?.url ?? input.image_url ?? null
    const bio           = input.bio ?? null
    const popularity    = spotify?.popularity ?? null
    const price         = derivePrice(popularity)
    const creatorScore  = deriveScore(popularity)

    const creator = {
      name:              displayName,
      ticker,
      slug,
      category,
      bio,
      avatar:            toAvatar(displayName),
      coverColor:        pickColor(ticker),
      price,
      creatorScore,
      imageUrl,
      spotify_followers: spotify?.followers?.total ?? null,
      spotify_id:        spotifyId ? spotifyId.replace(/\s+/g, '') : null,
      spotify_url:       spotify?.external_urls?.spotify ?? null,
      spotify_popularity: popularity,
    }

    // ── 1. Insert into Supabase creators table ──
    process.stdout.write(`     DB: creators… `)
    const dbRow = {
      name:                        creator.name,
      ticker:                      creator.ticker,
      slug:                        creator.slug,
      category:                    creator.category,
      bio:                         creator.bio,
      image_url:                   creator.imageUrl,
      momentum_score:              0,
      ...(creator.spotify_id && {
        spotify_artist_id:           creator.spotify_id,
        spotify_image_url:           creator.imageUrl,
        spotify_url:                 creator.spotify_url,
        spotify_followers:           creator.spotify_followers,
        spotify_popularity:          creator.spotify_popularity,
        spotify_latest_release_date: latestRelease,
        spotify_last_synced_at:      new Date().toISOString(),
      }),
    }

    const { data: created, error: creatorErr } = await admin
      .from('creators')
      .insert(dbRow)
      .select('id')
      .single()

    if (creatorErr && !creatorErr.message.includes('duplicate')) {
      console.log(`✗  ${creatorErr.message}`)
      results.push({ name: displayName, ticker, ok: false, reason: creatorErr.message })
      continue
    }

    const creatorId = created?.id
    console.log(creatorErr ? '⚠  already in DB' : `✓  id=${creatorId}`)

    // ── 2. Insert into artist_spot_counters ──
    if (creatorId) {
      process.stdout.write(`     DB: spot counter… `)
      const { error: counterErr } = await admin
        .from('artist_spot_counters')
        .insert({ creator_id: creatorId, next_spotter_number: 1, total_spotter_count: 0 })
        .select()
        .single()
      console.log(counterErr && !counterErr.message.includes('duplicate') ? `✗  ${counterErr.message}` : '✓')
    }

    // ── 3. Build mock data block ──
    mockBlocks.push(buildCreatorBlock(creator))

    // ── 4. Queue artist-map entry ──
    if (creator.spotify_id) {
      mapEntries.push({ ticker: creator.ticker, spotify_id: creator.spotify_id })
    }

    results.push({
      name: displayName,
      ticker,
      ok: true,
      price,
      creatorScore,
      followers: formatFollowers(creator.spotify_followers),
      popularity,
    })
  }

  // ── Write mock data ──
  if (mockBlocks.length) {
    process.stdout.write('\n  Writing lib/mock-data/creators.ts… ')
    const ok = insertIntoMockData(mockBlocks)
    console.log(ok ? '✓' : '✗ file not found')
  }

  // ── Write artist-map ──
  if (mapEntries.length) {
    process.stdout.write('  Writing lib/spotify/artist-map.ts… ')
    const ok = updateArtistMap(mapEntries)
    console.log(ok ? '✓' : '✗ file not found')
  }

  // ── Summary ──
  const ok   = results.filter(r => r.ok)
  const fail = results.filter(r => !r.ok)

  console.log('\n' + '─'.repeat(44))
  if (ok.length) {
    console.log(`\n  ✓ ${ok.length} artist(s) added and live in the app:`)
    for (const r of ok) {
      const extras = [
        r.followers !== '0' && `${r.followers} followers`,
        r.popularity && `popularity ${r.popularity}/100`,
      ].filter(Boolean)
      console.log(`     • ${r.name}  $${r.ticker}  —  score ${r.creatorScore}${extras.length ? ', ' + extras.join(', ') : ''}`)
    }
  }
  if (fail.length) {
    console.log(`\n  ✗ ${fail.length} failed:`)
    for (const r of fail) console.log(`     • ${r.name}: ${r.reason}`)
  }

  console.log('\n  Artists appear in Explore, home feed, and search immediately.')
  console.log('  Spotify cron syncs image + followers every 3 h.\n')

  if (fail.length && !ok.length) process.exit(1)
}

main().catch(err => {
  console.error('\n  Fatal:', err.message)
  process.exit(1)
})
