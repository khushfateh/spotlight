#!/usr/bin/env node
/**
 * add-artists.mjs
 *
 * Add new artists to SPOTLIGHT — fully wired end-to-end:
 *   1. Looks up Spotify data automatically (image, bio hint, followers, popularity)
 *   2. Inserts into `creators` table
 *   3. Inserts into `artist_spot_counters` (required for spotter ranking system)
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
 *     "ticker": "BILLIE",          // auto-derived if omitted
 *     "category": "Music",         // Music | Gaming | Sports | Content | Lifestyle | Podcast
 *     "spotify_id": "6qqNVTkY8uBg9cP3Jd7DAH",  // auto-searched if omitted
 *     "bio": "Custom bio text"     // auto-generated from Spotify if omitted
 *   }
 * ]
 *
 * Env (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL   — required
 *   SUPABASE_SECRET_KEY        — required (service role, bypasses RLS)
 *   SPOTIFY_CLIENT_ID          — optional (enables auto-lookup)
 *   SPOTIFY_CLIENT_SECRET      — optional
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
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
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

// Build the input list
let inputs = []

if (fileArg) {
  inputs = JSON.parse(readFileSync(resolve(process.cwd(), fileArg), 'utf8'))
} else {
  inputs = namesRaw.split(',').map(n => ({ name: n.trim() })).filter(a => a.name)
}

// ─── Supabase admin client ─────────────────────────────────────────────────

const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY

if (!url || !secret) {
  console.error('  Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be in .env.local')
  process.exit(1)
}

const admin = createClient(url, secret, {
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
  if (!res.ok) return null
  return res.json()
}

async function lookupSpotifyById(id) {
  return spotifyGet(`/artists/${id}`)
}

async function searchSpotify(name) {
  const q = encodeURIComponent(name)
  const data = await spotifyGet(`/search?q=${q}&type=artist&limit=1`)
  return data?.artists?.items?.[0] ?? null
}

async function getLatestRelease(artistId) {
  const data = await spotifyGet(
    `/artists/${artistId}/albums?include_groups=album,single&market=US&limit=1`
  )
  return data?.items?.[0]?.release_date ?? null
}

// ─── Ticker / slug derivation ──────────────────────────────────────────────

function toTicker(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')   // strip non-alphanumeric
    .slice(0, 12)                  // max 12 chars
}

function toSlug(ticker) {
  return ticker.toLowerCase()
}

// ─── artist-map.ts updater ─────────────────────────────────────────────────

function updateArtistMap(entries) {
  const mapPath = resolve(root, 'lib/spotify/artist-map.ts')
  if (!existsSync(mapPath)) return false

  let src = readFileSync(mapPath, 'utf8')

  const newLines = entries
    .filter(e => e.spotify_id)
    .map(e => `  ${e.ticker.padEnd(12)} '${e.spotify_id}',`)
    .join('\n')

  if (!newLines) return false

  // Insert before the closing `}` of the export object
  src = src.replace(/(\n}\s*$)/, `\n  // Added via add-artists script\n${newLines}\n$1`)
  writeFileSync(mapPath, src, 'utf8')
  return true
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎵 SPOTLIGHT — Add Artists Script')
  console.log('─'.repeat(44))

  const hasSpotify = !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
  if (!hasSpotify) {
    console.log('  ⚠  SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set')
    console.log('     Artists will be created with minimal data (no image, bio, or follower count)\n')
  }

  const results  = []
  const mapEntries = []

  for (const input of inputs) {
    const displayName = input.name
    process.stdout.write(`\n  Processing: ${displayName}\n`)

    // 1 — Derive ticker + slug
    const ticker = (input.ticker ?? toTicker(displayName)).toUpperCase()
    const slug   = toSlug(ticker)

    // 2 — Check for existing ticker / slug
    const { data: existing } = await admin
      .from('creators')
      .select('id, ticker')
      .or(`ticker.eq.${ticker},slug.eq.${slug}`)
      .maybeSingle()

    if (existing) {
      console.log(`     ⚠  Ticker/slug already exists (${existing.ticker}) — skipping`)
      results.push({ name: displayName, ticker, ok: false, reason: 'already exists' })
      continue
    }

    // 3 — Spotify lookup
    let spotify = null
    let spotifyId = input.spotify_id ?? null

    if (hasSpotify) {
      if (spotifyId) {
        process.stdout.write(`     Spotify: fetching by ID ${spotifyId}… `)
        spotify = await lookupSpotifyById(spotifyId.trim())
      } else {
        process.stdout.write(`     Spotify: searching "${displayName}"… `)
        spotify = await searchSpotify(displayName)
        if (spotify) spotifyId = spotify.id
      }
      console.log(spotify ? `found "${spotify.name}"` : 'not found')
    }

    let latestReleaseDate = null
    if (spotify?.id) {
      latestReleaseDate = await getLatestRelease(spotify.id)
    }

    // 4 — Build the creator row
    const category = input.category ?? 'Music'
    const image    = spotify?.images?.[0]?.url ?? input.image_url ?? null
    const bio      = input.bio ?? null

    const row = {
      name:                       displayName,
      ticker,
      slug,
      category,
      bio,
      image_url:                  image,
      momentum_score:             0,
      ...(spotifyId && {
        spotify_artist_id:          spotifyId.replace(/\s+/g, ''),
        spotify_image_url:          spotify?.images?.[0]?.url ?? null,
        spotify_url:                spotify?.external_urls?.spotify ?? null,
        spotify_followers:          spotify?.followers?.total ?? null,
        spotify_popularity:         spotify?.popularity ?? null,
        spotify_latest_release_date: latestReleaseDate,
        spotify_last_synced_at:     new Date().toISOString(),
      }),
    }

    // 5 — Insert into creators
    process.stdout.write(`     Inserting creator… `)
    const { data: created, error: creatorErr } = await admin
      .from('creators')
      .insert(row)
      .select('id')
      .single()

    if (creatorErr) {
      console.log(`✗  ${creatorErr.message}`)
      results.push({ name: displayName, ticker, ok: false, reason: creatorErr.message })
      continue
    }

    console.log(`✓  id=${created.id}`)

    // 6 — Insert into artist_spot_counters (required for spotter ranking)
    process.stdout.write(`     Seeding spot counter… `)
    const { error: counterErr } = await admin
      .from('artist_spot_counters')
      .insert({ creator_id: created.id, next_spotter_number: 1, total_spotter_count: 0 })

    if (counterErr) {
      console.log(`✗  ${counterErr.message}`)
      // Creator is in DB but spotter counter failed — still report partial success
      results.push({ name: displayName, ticker, ok: false, reason: `counter: ${counterErr.message}`, creator_id: created.id })
      continue
    }

    console.log('✓')

    if (spotifyId) mapEntries.push({ ticker, spotify_id: spotifyId.replace(/\s+/g, '') })

    const followers = spotify?.followers?.total
      ? (spotify.followers.total >= 1_000_000
          ? `${(spotify.followers.total / 1_000_000).toFixed(1)}M`
          : `${Math.round(spotify.followers.total / 1000)}K`)
      : null

    results.push({ name: displayName, ticker, ok: true, creator_id: created.id, followers, popularity: spotify?.popularity })
  }

  // 7 — Update artist-map.ts
  if (mapEntries.length) {
    process.stdout.write('\n  Updating lib/spotify/artist-map.ts… ')
    const updated = updateArtistMap(mapEntries)
    console.log(updated ? '✓' : '⚠  file not found, skipped')
  }

  // 8 — Summary
  const ok   = results.filter(r => r.ok)
  const fail = results.filter(r => !r.ok)

  console.log('\n' + '─'.repeat(44))
  console.log(`\n  ✓ ${ok.length} artist(s) added successfully:`)
  for (const r of ok) {
    const extras = [r.followers && `${r.followers} followers`, r.popularity && `popularity ${r.popularity}`].filter(Boolean)
    console.log(`     • ${r.name} ($${r.ticker})${extras.length ? '  —  ' + extras.join(', ') : ''}`)
  }
  if (fail.length) {
    console.log(`\n  ✗ ${fail.length} failed:`)
    for (const r of fail) console.log(`     • ${r.name}: ${r.reason}`)
  }

  console.log('\n  Artists are live in the database and will appear in the app immediately.')
  console.log('  Spotify data (image, followers) syncs via cron every 3 h.\n')

  if (fail.length) process.exit(1)
}

main().catch(err => {
  console.error('\n  Fatal:', err.message)
  process.exit(1)
})
