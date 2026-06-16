import { supabase } from '@/lib/supabase/client'
import { getArtist, getArtistAlbums, searchArtist } from './service'

export type SpotifySyncResult =
  | { ok: true; artistId: string; name: string }
  | { ok: false; error: string }

export async function syncCreatorBySpotifyArtistId(
  ticker: string,
  spotifyArtistId: string
): Promise<SpotifySyncResult> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }

  const [artist, albums] = await Promise.all([
    getArtist(spotifyArtistId),
    getArtistAlbums(spotifyArtistId),
  ])

  if (!artist) return { ok: false, error: 'Spotify artist not found' }

  const latestReleaseDate = albums[0]?.release_date ?? null

  const { error } = await supabase
    .from('creators')
    .update({
      spotify_artist_id: artist.id,
      spotify_image_url: artist.images[0]?.url ?? null,
      spotify_url: artist.external_urls.spotify,
      spotify_latest_release_date: latestReleaseDate,
      spotify_last_synced_at: new Date().toISOString(),
    })
    .eq('ticker', ticker.toUpperCase())

  if (error) return { ok: false, error: error.message }

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
  if (!supabase) return { synced: [], failed: tickers }

  const { data: rows } = await supabase
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
