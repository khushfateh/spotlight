import { getSpotifyToken } from './auth'

const BASE = 'https://api.spotify.com/v1'

export async function spotifyFetch<T>(path: string): Promise<T | null> {
  const token = await getSpotifyToken()
  if (!token) return null

  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return null
  return res.json() as Promise<T>
}
