import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export type MomentumEntry = {
  ticker: string
  followersNow: number
  followersPrev: number | null
  followersChange: number
  followersChangePct: number
  popularity: number | null
  snappedAt: string
}

export type MomentumResponse = {
  entries: MomentumEntry[]
  hasData: boolean
  generatedAt: string
}

// Cache for 3 minutes — short enough to feel live, long enough to not hammer the DB
export const revalidate = 180

export async function GET() {
  if (!supabase) {
    return NextResponse.json<MomentumResponse>({
      entries: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    })
  }

  // Grab all snapshots from the last 8 hours so we can compare
  // latest vs the one from ~3 hours ago (previous sync window)
  const windowStart = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()

  type Snapshot = {
    ticker: string
    spotify_followers: number | null
    spotify_popularity: number | null
    snapped_at: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSnapshots, error } = await (supabase as any)
    .from('creator_stats_snapshots')
    .select('ticker, spotify_followers, spotify_popularity, snapped_at')
    .gte('snapped_at', windowStart)
    .order('snapped_at', { ascending: false })

  const snapshots = rawSnapshots as Snapshot[] | null

  if (error || !snapshots?.length) {
    return NextResponse.json<MomentumResponse>({
      entries: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    })
  }

  // Group snapshots by ticker — already ordered newest-first
  const byTicker = new Map<string, typeof snapshots>()
  for (const s of snapshots) {
    const arr = byTicker.get(s.ticker) ?? []
    arr.push(s)
    byTicker.set(s.ticker, arr)
  }

  const entries: MomentumEntry[] = []

  for (const [ticker, snaps] of byTicker) {
    const latest = snaps[0]
    const prev = snaps.length > 1 ? snaps[snaps.length - 1] : null

    if (!latest.spotify_followers) continue

    const followersPrev = prev?.spotify_followers ?? null
    const followersChange = followersPrev != null
      ? latest.spotify_followers - followersPrev
      : 0
    const followersChangePct = followersPrev && followersPrev > 0
      ? (followersChange / followersPrev) * 100
      : 0

    entries.push({
      ticker,
      followersNow: latest.spotify_followers,
      followersPrev,
      followersChange,
      followersChangePct,
      popularity: latest.spotify_popularity ?? null,
      snappedAt: latest.snapped_at,
    })
  }

  // Sort: highest positive % change first
  entries.sort((a, b) => b.followersChangePct - a.followersChangePct)

  return NextResponse.json<MomentumResponse>({
    entries,
    hasData: entries.length > 0,
    generatedAt: new Date().toISOString(),
  })
}
