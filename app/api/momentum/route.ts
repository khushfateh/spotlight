import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase/client'

// Spotify Client Credentials doesn't return follower counts, so momentum is
// based on release recency: a normalized score 0-100 where 100 = released today.
export type MomentumEntry = {
  ticker: string
  followersNow: number         // always 0 — followers not available via Client Credentials
  followersPrev: number | null // always null
  followersChange: number      // always 0
  followersChangePct: number   // repurposed as release recency score (0-100)
  popularity: number | null    // always null — not returned by Client Credentials
  snappedAt: string
  latestReleaseDate: string | null
  daysSinceRelease: number | null
}

export type MomentumResponse = {
  entries: MomentumEntry[]
  hasData: boolean
  generatedAt: string
}

// Cache for 3 minutes — short enough to feel live, long enough to not hammer the DB
export const revalidate = 180

const db = supabaseAdmin ?? supabase

function releaseRecencyScore(releaseDate: string | null): number {
  if (!releaseDate) return 0
  const days = (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24)
  if (days < 0) return 0
  if (days <= 7) return Math.round(100 - days * 2)        // 86–100
  if (days <= 30) return Math.round(85 - (days - 7) * 2)  // 39–85
  if (days <= 90) return Math.round(38 - (days - 30) / 2) // 8–38
  if (days <= 365) return Math.round(7 - (days - 90) / 50) // 1–7
  return 0
}

export async function GET() {
  if (!db) {
    return NextResponse.json<MomentumResponse>({
      entries: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    })
  }

  type CreatorRow = {
    ticker: string
    spotify_latest_release_date: string | null
    spotify_last_synced_at: string | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawRows, error } = await (db as any)
    .from('creators')
    .select('ticker, spotify_latest_release_date, spotify_last_synced_at')
    .not('spotify_last_synced_at', 'is', null)
    .order('spotify_latest_release_date', { ascending: false })

  const rows = rawRows as CreatorRow[] | null

  if (error || !rows?.length) {
    return NextResponse.json<MomentumResponse>({
      entries: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    })
  }

  const entries: MomentumEntry[] = rows.map(row => {
    const releaseDate = row.spotify_latest_release_date ?? null
    const daysSinceRelease = releaseDate
      ? Math.round((Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const score = releaseRecencyScore(releaseDate)

    return {
      ticker: row.ticker,
      followersNow: 0,
      followersPrev: null,
      followersChange: 0,
      followersChangePct: score,
      popularity: null,
      snappedAt: row.spotify_last_synced_at ?? new Date().toISOString(),
      latestReleaseDate: releaseDate,
      daysSinceRelease,
    }
  }).filter(e => e.followersChangePct > 0)

  entries.sort((a, b) => b.followersChangePct - a.followersChangePct)

  return NextResponse.json<MomentumResponse>({
    entries,
    hasData: entries.length > 0,
    generatedAt: new Date().toISOString(),
  })
}
