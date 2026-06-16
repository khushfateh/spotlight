import { creators } from '@/lib/mock-data/creators'
import { genres } from '@/lib/mock-data/genres'
import { MOMENTUM } from '@/lib/mock-data/momentum'
import { earlySpots } from '@/lib/mock-data/spots'
import type { CreatorSignal } from './types'

function getCreatorGenreIds(ticker: string): string[] {
  const upper = ticker.toUpperCase()
  return genres
    .filter(g => g.creatorTickers.includes(upper))
    .map(g => g.id)
}

function getSpotCount(ticker: string): number {
  return earlySpots.filter(s => s.creatorTicker === ticker.toUpperCase()).length
}

function getCatalystStrength(ticker: string): number {
  const creator = creators.find(c => c.ticker.toUpperCase() === ticker.toUpperCase())
  if (!creator?.catalysts?.length) return 0
  const high = creator.catalysts.filter(c => c.impact === 'high').length
  const med  = creator.catalysts.filter(c => c.impact === 'medium').length
  return Math.min(1, high * 0.35 + med * 0.15)
}

function getFreshness(ticker: string): number {
  const spots = earlySpots.filter(s => s.creatorTicker === ticker.toUpperCase())
  if (!spots.length) return 0.85
  const earliest = Math.max(...spots.map(s => s.daysAgo))
  // Creators discovered recently (low daysAgo) have higher freshness
  return Math.max(0.05, 1 - Math.min(earliest, 400) / 400)
}

export function buildCreatorSignal(ticker: string): CreatorSignal {
  const upper = ticker.toUpperCase()
  const momentum = MOMENTUM[upper] ?? { score: 50, delta: 0 }
  const spotCount = getSpotCount(upper)

  return {
    ticker: upper,
    genreIds: getCreatorGenreIds(upper),
    momentumScore: momentum.score,
    momentumDelta: momentum.delta,
    spotCount,
    communityInterest: Math.min(1, spotCount / 5),
    catalystStrength: getCatalystStrength(upper),
    freshness: getFreshness(upper),
    editorialBoost: 0,
  }
}

export function buildAllCreatorSignals(): Map<string, CreatorSignal> {
  const map = new Map<string, CreatorSignal>()
  for (const c of creators) {
    map.set(c.ticker.toUpperCase(), buildCreatorSignal(c.ticker))
  }
  return map
}
