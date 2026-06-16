import { spotifyFetch } from './client'
import type {
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyCreatorSnapshot,
  SpotifySearchResult,
} from './types'

export async function searchArtist(query: string): Promise<SpotifyArtist[]> {
  const data = await spotifyFetch<SpotifySearchResult>(
    `/search?q=${encodeURIComponent(query)}&type=artist&limit=5`
  )
  return data?.artists.items ?? []
}

export async function getArtist(id: string): Promise<SpotifyArtist | null> {
  return spotifyFetch<SpotifyArtist>(`/artists/${id}`)
}

// top-tracks requires user OAuth — not available with Client Credentials flow
export async function getArtistAlbums(id: string): Promise<SpotifyAlbum[]> {
  const data = await spotifyFetch<{ items: SpotifyAlbum[] }>(
    `/artists/${id}/albums?include_groups=album,single&market=US&limit=5`
  )
  return data?.items ?? []
}

export async function getCreatorSnapshot(spotifyArtistId: string): Promise<SpotifyCreatorSnapshot | null> {
  const [artist, albums] = await Promise.all([
    getArtist(spotifyArtistId),
    getArtistAlbums(spotifyArtistId),
  ])

  if (!artist) return null

  return {
    artistId: artist.id,
    name: artist.name,
    imageUrl: artist.images[0]?.url ?? null,
    spotifyUrl: artist.external_urls.spotify,
    recentReleases: albums.map(a => ({
      id: a.id,
      name: a.name,
      type: a.album_type,
      releaseDate: a.release_date,
      totalTracks: a.total_tracks,
      imageUrl: a.images[0]?.url ?? null,
      spotifyUrl: a.external_urls.spotify,
    })),
  }
}
