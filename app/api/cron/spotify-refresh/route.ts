import { NextRequest, NextResponse } from 'next/server'
import { refreshAllCreators } from '@/lib/spotify/sync'

// Vercel cron sends Authorization: Bearer <CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const result = await refreshAllCreators()
  const durationMs = Date.now() - started

  return NextResponse.json({
    ok: true,
    synced: result.synced.length,
    failed: result.failed.length,
    failedTickers: result.failed,
    errors: result.errors,
    adminClientActive: result.adminClientActive,
    durationMs,
    timestamp: new Date().toISOString(),
  })
}
