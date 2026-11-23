#!/usr/bin/env node
/**
 * fix-spotify-ids.mjs
 *
 * For every creator in the DB that is missing a spotify_artist_id:
 *   1. Strips "COUNTRY - " prefix from the display name (updates the name in DB too)
 *   2. Searches Spotify for the clean artist name
 *   3. Updates the creators row with spotify_artist_id, image, followers, popularity
 *   4. Updates lib/spotify/artist-map.ts
 *
 * Usage:
 *   node scripts/fix-spotify-ids.mjs
 *   node scripts/fix-spotify-ids.mjs --dry-run
 *   node scripts/fix-spotify-ids.mjs --limit 50   # test a small batch first
 *
 * Re-runnable: already-fixed artists are skipped automatically (they have a
 * spotify_artist_id now). If Spotify's daily quota kicks in mid-run the script
 * exits cleanly and prints how many it processed — just re-run tomorrow.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = resolve(__dir, '..')

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

const DRY   = process.argv.includes('--dry-run')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity

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
  if (!id || !sec) throw new Error('Spotify credentials missing')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const { access_token, error } = await res.json()
  if (!access_token) throw new Error(`Spotify token error: ${error}`)
  _token = access_token
  return access_token
}

// Thrown when Spotify returns a long Retry-After so main() can exit cleanly.
class RateLimitError extends Error {
  constructor(waitSecs) {
    super(`Spotify daily quota hit — Retry-After: ${waitSecs}s (~${Math.round(waitSecs / 3600)}h)`)
    this.waitSecs = waitSecs
  }
}

async function searchSpotify(name, retries = 4) {
  const token = await getToken()
  let res
  try {
    res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) }
    )
  } catch (err) {
    // Network-level failures (ECONNRESET, ETIMEDOUT, etc.) — retry with backoff
    if (retries > 0) {
      const delay = (5 - retries) * 3000 // 3s, 6s, 9s, 12s
      process.stdout.write(` [net err, retry in ${delay / 1000}s]`)
      await new Promise(r => setTimeout(r, delay))
      return searchSpotify(name, retries - 1)
    }
    return null // give up after 4 retries, treat as not found
  }
  if (res.status === 429) {
    const wait = parseInt(res.headers.get('Retry-After') || '10', 10)
    if (wait > 300) {
      // Daily quota — don't sleep for hours, just bail so the user can re-run tomorrow.
      throw new RateLimitError(wait)
    }
    process.stdout.write(` [rate limit, wait ${wait}s]`)
    await new Promise(r => setTimeout(r, wait * 1000))
    return searchSpotify(name, retries)
  }
  if (!res.ok) return null
  const data = await res.json()
  return data?.artists?.items?.[0] ?? null
}

// ─── Name cleaning ────────────────────────────────────────────────────────────
// Strips patterns like "SOUTH KOREA - BTS", "NIGERIA - Burna Boy"
function cleanName(rawName) {
  // Match "ALL CAPS COUNTRY - Artist Name" or "COUNTRY - Artist"
  const m = rawName.match(/^[A-Z][A-Z\s&']+\s+-\s+(.+)$/)
  if (m) return m[1].trim()
  return rawName
}

// ─── artist-map.ts updater ───────────────────────────────────────────────────
function updateArtistMap(ticker, spotifyId) {
  const mapPath = resolve(root, 'lib/spotify/artist-map.ts')
  let content = readFileSync(mapPath, 'utf8')

  // Already there?
  if (content.includes(spotifyId)) return

  // Append before closing }
  const closeIdx = content.lastIndexOf('}')
  const newLine  = `  ${(ticker + ':').padEnd(16)} '${spotifyId}',\n`
  content = content.slice(0, closeIdx) + newLine + content.slice(closeIdx)
  writeFileSync(mapPath, content, 'utf8')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 SPOTLIGHT Spotify ID Fixer\n')
  if (DRY) console.log('  [DRY RUN]\n')

  // ── Fetch ALL missing creators with Supabase pagination (default page = 1000) ─
  const PAGE = 1000
  const creators = []
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('creators')
      .select('id, name, ticker')
      .or('spotify_artist_id.is.null,spotify_artist_id.eq.')
      .order('name')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    creators.push(...data)
    if (data.length < PAGE) break   // last page
    from += PAGE
  }

  console.log(`  Found ${creators.length} creators without Spotify ID\n`)

  const toProcess = LIMIT < Infinity ? creators.slice(0, LIMIT) : creators
  if (LIMIT < Infinity) console.log(`  Processing first ${toProcess.length}\n`)

  let found = 0, notFound = 0, nameFixed = 0, errors = 0
  const notFoundNames = []

  for (let i = 0; i < toProcess.length; i++) {
    const c = toProcess[i]
    const cleanedName = cleanName(c.name)
    const nameChanged = cleanedName !== c.name

    process.stdout.write(
      `  [${i + 1}/${toProcess.length}] ${cleanedName}${nameChanged ? ` (was: "${c.name}")` : ''}… `
    )

    let artist
    try {
      artist = await searchSpotify(cleanedName)
    } catch (e) {
      if (e instanceof RateLimitError) {
        console.log(`\n\n  ⚠  ${e.message}`)
        console.log(`  Processed ${i} of ${toProcess.length} this run.`)
        console.log('  Re-run the script tomorrow — already-fixed artists are skipped.\n')
        printSummary(found, notFound, nameFixed, errors, notFoundNames)
        return
      }
      throw e
    }

    if (!artist) {
      console.log('✗ not found')
      notFound++
      notFoundNames.push(cleanedName)
      if (nameChanged && !DRY) {
        await admin.from('creators').update({ name: cleanedName }).eq('id', c.id)
      }
      await new Promise(r => setTimeout(r, 100))
      continue
    }

    console.log(`✓ ${artist.name} (${artist.followers?.total?.toLocaleString()} followers)`)
    found++
    if (nameChanged) nameFixed++

    if (!DRY) {
      const update = {
        name:                        cleanedName,
        spotify_artist_id:           artist.id,
        spotify_image_url:           artist.images?.[0]?.url ?? null,
        spotify_url:                 artist.external_urls?.spotify ?? null,
        spotify_followers:           artist.followers?.total ?? null,
        spotify_popularity:          artist.popularity ?? null,
        spotify_last_synced_at:      new Date().toISOString(),
        ...(artist.images?.[0]?.url && { image_url: artist.images[0].url }),
      }
      const { error: ue } = await admin.from('creators').update(update).eq('id', c.id)
      if (ue) { console.error(`    ✗ DB update failed: ${ue.message}`); errors++ }
      else updateArtistMap(c.ticker, artist.id)
    }

    // Pace requests — 120ms gap (~8 req/s, well under Spotify's 100 req/s limit)
    await new Promise(r => setTimeout(r, 120))
  }

  printSummary(found, notFound, nameFixed, errors, notFoundNames)
}

function printSummary(found, notFound, nameFixed, errors, notFoundNames) {
  console.log('\n─────────────────────────────────')
  console.log(`  Found on Spotify:  ${found}`)
  console.log(`  Not found:         ${notFound}`)
  console.log(`  Names cleaned:     ${nameFixed}`)
  if (errors) console.log(`  DB errors:         ${errors}`)
  console.log('')
  if (notFoundNames.length > 0 && notFoundNames.length <= 40) {
    console.log('  Not found:')
    notFoundNames.forEach(n => console.log(`    • ${n}`))
    console.log('')
  }
}

main().catch(err => { console.error('\n✗ Fatal:', err.message); process.exit(1) })
