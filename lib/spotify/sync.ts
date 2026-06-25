import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getArtist, getArtistAlbums, searchArtist } from './service'

// Use admin client for server-side writes (bypasses RLS on creators table)
const db = supabaseAdmin ?? supabase

export type SpotifySyncResult =
  | { ok: true; artistId: string; name: string }
  | { ok: false; error: string }

export async function syncCreatorBySpotifyArtistId(
  ticker: string,
  spotifyArtistId: string
): Promise<SpotifySyncResult> {
  if (!db) return { ok: false, error: 'Supabase not configured' }

  // noCache=true: cron always needs live Spotify data, never stale cache
  const [artist, albums] = await Promise.all([
    getArtist(spotifyArtistId, true),
    getArtistAlbums(spotifyArtistId, true),
  ])

  if (!artist) return { ok: false, error: 'Spotify artist not found' }

  const latestReleaseDate = albums[0]?.release_date ?? null
  const now = new Date().toISOString()
  const normalizedTicker = ticker.toUpperCase()

  // Fetch creator UUID (needed for snapshot FK)
  const { data: creatorRow } = await db
    .from('creators')
    .select('id')
    .eq('ticker', normalizedTicker)
    .single()

  // Update creator with latest Spotify data
  const { error: updateError } = await db
    .from('creators')
    .update({
      spotify_artist_id: artist.id,
      spotify_image_url: artist.images[0]?.url ?? null,
      spotify_url: artist.external_urls.spotify,
      spotify_latest_release_date: latestReleaseDate,
      spotify_last_synced_at: now,
      spotify_followers: artist.followers?.total ?? null,
      spotify_popularity: artist.popularity ?? null,
    })
    .eq('ticker', normalizedTicker)

  if (updateError) return { ok: false, error: updateError.message }

  // Insert time-series snapshot for momentum calculation
  // Cast to any until supabase types are regenerated after migration runs
  if (creatorRow?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from('creator_stats_snapshots').insert({
      creator_id: creatorRow.id,
      ticker: normalizedTicker,
      spotify_followers: artist.followers?.total ?? null,
      spotify_popularity: artist.popularity ?? null,
      snapped_at: now,
    })
  }

  return { ok: true, artistId: artist.id, name: artist.name }
}

export async function searchAndAttachSpotifyArtist(
  ticker: string,
  query: string
): Promise<SpotifySyncResult> {
  const artists = await searchArtist(query)
  if (!artists.length) return { ok: false, error: 'No artists found on Spotify' }
  return syncCreatorBySpotifyArtistId(ticker, artists[0].id)
}

export async function refreshSpotifyDataForCreators(tickers: string[]): Promise<{
  synced: string[]
  failed: string[]
}> {
  if (!db) return { synced: [], failed: tickers }

  const { data: rows } = await db
    .from('creators')
    .select('ticker, spotify_artist_id')
    .in('ticker', tickers.map(t => t.toUpperCase()))
    .not('spotify_artist_id', 'is', null)

  const synced: string[] = []
  const failed: string[] = []

  for (const row of rows ?? []) {
    if (!row.spotify_artist_id) continue
    const result = await syncCreatorBySpotifyArtistId(row.ticker, row.spotify_artist_id)
    if (result.ok) synced.push(row.ticker)
    else failed.push(row.ticker)
  }

  return { synced, failed }
}

// Sync ALL creators that have a spotify_artist_id — called by the cron job
export async function refreshAllCreators(): Promise<{
  synced: string[]
  failed: string[]
  skipped: number
  errors: Record<string, string>
  adminClientActive: boolean
}> {
  const adminClientActive = !!supabaseAdmin
  if (!db) return { synced: [], failed: [], skipped: 0, errors: {}, adminClientActive }

  const { data: rows } = await db
    .from('creators')
    .select('ticker, spotify_artist_id')
    .not('spotify_artist_id', 'is', null)

  if (!rows?.length) return { synced: [], failed: [], skipped: 0, errors: {}, adminClientActive }

  const synced: string[] = []
  const failed: string[] = []
  const errors: Record<string, string> = {}

  for (const row of rows) {
    if (!row.spotify_artist_id) continue
    await new Promise(r => setTimeout(r, 120))
    const result = await syncCreatorBySpotifyArtistId(row.ticker, row.spotify_artist_id)
    if (result.ok) synced.push(row.ticker)
    else {
      failed.push(row.ticker)
      errors[row.ticker] = result.error
    }
  }

  return { synced, failed, skipped: 0, errors, adminClientActive }
}
