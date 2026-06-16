import { NextRequest, NextResponse } from 'next/server'
import { refreshSpotifyDataForCreators } from '@/lib/spotify/sync'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { tickers?: string[] }
  const tickers = body.tickers ?? []

  if (!tickers.length) {
    return NextResponse.json({ error: 'Provide a non-empty tickers array' }, { status: 400 })
  }

  const result = await refreshSpotifyDataForCreators(tickers)
  return NextResponse.json(result)
}
