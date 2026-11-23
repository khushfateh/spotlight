import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { submitArtistRequest, getRequestStatus } from '@/lib/services/artistRequestService'

async function getAuthUser(req: NextRequest) {
  if (!supabaseAdmin) return null
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user
}

// GET /api/artist-requests?artist_name=Drake
// Returns whether the current user already requested this artist + total request count.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const name = req.nextUrl.searchParams.get('artist_name') ?? ''
  if (!name.trim()) return NextResponse.json({ alreadyRequested: false, requestCount: 0 })

  const status = await getRequestStatus(user.id, name)
  return NextResponse.json(status)
}

// POST /api/artist-requests
// Body: { artistName, genre?, country?, spotifyUrl?, instagramHandle?, youtubeUrl?, reason? }
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const artistName: string = (body.artistName ?? '').trim()

  if (!artistName) {
    return NextResponse.json({ error: 'artistName is required' }, { status: 400 })
  }

  const result = await submitArtistRequest({
    userId:          user.id,
    userEmail:       user.email ?? '',
    artistName,
    genre:           body.genre           || undefined,
    country:         body.country         || undefined,
    spotifyUrl:      body.spotifyUrl      || undefined,
    instagramHandle: body.instagramHandle || undefined,
    youtubeUrl:      body.youtubeUrl      || undefined,
    reason:          body.reason          || undefined,
  })

  if (!result.ok) {
    if (result.error === 'already_requested') {
      return NextResponse.json({ error: 'already_requested', count: result.count }, { status: 409 })
    }
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: result.count }, { status: 201 })
}
