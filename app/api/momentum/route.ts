import { NextResponse } from 'next/server'
import { getMomentumRanking } from '@/lib/services/momentumService'
import type { MomentumScore } from '@/lib/momentum/types'

export type MomentumEntry = {
  ticker: string
  score: number
  breakout: boolean
  signals: MomentumScore['signals']
  generatedAt: string
}

export type MomentumResponse = {
  entries: MomentumEntry[]
  hasData: boolean
  generatedAt: string
}

// Cache for 3 minutes — short enough to feel live, long enough to not hammer the DB
export const revalidate = 180

export async function GET() {
  try {
    const scores = await getMomentumRanking()
    const now = new Date().toISOString()
    const entries: MomentumEntry[] = scores.map(s => ({
      ticker: s.ticker,
      score: s.score,
      breakout: s.breakout,
      signals: s.signals,
      generatedAt: now,
    }))
    return NextResponse.json<MomentumResponse>({
      entries,
      hasData: entries.length > 0,
      generatedAt: now,
    })
  } catch {
    return NextResponse.json<MomentumResponse>({
      entries: [],
      hasData: false,
      generatedAt: new Date().toISOString(),
    })
  }
}
