import { NextRequest, NextResponse } from 'next/server'

// Temporary debug route — remove after diagnosing Spotify token issue
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID ?? ''
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? ''

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

  const body = await res.text()

  return NextResponse.json({
    tokenStatus: res.status,
    tokenOk: res.ok,
    responseSnippet: body.slice(0, 200),
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length,
  })
}
