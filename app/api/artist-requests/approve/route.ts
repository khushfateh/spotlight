import { NextRequest, NextResponse } from 'next/server'
import { approveArtistRequest } from '@/lib/services/artistRequestService'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// POST /api/artist-requests/approve
// Protected by ADMIN_SECRET env var (same pattern as cron).
// Body: { artistName: string, ticker?: string }
//
// Usage:
//   curl -X POST https://your-domain.com/api/artist-requests/approve \
//     -H "Authorization: Bearer $ADMIN_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"artistName": "Tate McRae"}'
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const artistName: string = (body.artistName ?? '').trim()
  const ticker: string | undefined = body.ticker?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || undefined

  if (!artistName) {
    return NextResponse.json({ error: 'artistName is required' }, { status: 400 })
  }

  const result = await approveArtistRequest(artistName, ticker)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'No pending requests found' ? 404 : 500 })
  }

  return NextResponse.json({ ok: true, ticker: result.ticker })
}
