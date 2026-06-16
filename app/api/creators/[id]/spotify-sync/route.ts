import { NextRequest, NextResponse } from 'next/server'
import { syncCreatorBySpotifyArtistId, searchAndAttachSpotifyArtist } from '@/lib/spotify/sync'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticker } = await params
  const body = (await req.json()) as { spotifyArtistId?: string; query?: string }

  if (body.spotifyArtistId) {
    const result = await syncCreatorBySpotifyArtistId(ticker, body.spotifyArtistId)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  if (body.query) {
    const result = await searchAndAttachSpotifyArtist(ticker, body.query)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  return NextResponse.json(
    { error: 'Provide spotifyArtistId or query in request body' },
    { status: 400 }
  )
}
