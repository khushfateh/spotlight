import { NextRequest, NextResponse } from 'next/server'
import { searchArtist } from '@/lib/spotify/service'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })

  const artists = await searchArtist(q)
  return NextResponse.json({ artists })
}
