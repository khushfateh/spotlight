import type { SpotifyToken } from './types'

// Module-level cache — survives across requests in the same warm serverless instance.
let cachedToken: SpotifyToken | null = null

function isValid(token: SpotifyToken): boolean {
  return Date.now() < token.expiresAt - 60_000
}

export async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (cachedToken && isValid(cachedToken)) return cachedToken.accessToken

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) return null

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.accessToken
}
