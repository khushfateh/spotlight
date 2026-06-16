import { mockUsers } from '@/lib/mock-data/users'
import { getUserViewedTickers, getUserSearchTerms } from '@/lib/mock-data/interactions'
import { IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import { getSpottedCreatorIds } from '@/lib/repositories/spotRepository'
import { getFollowedCreatorIds } from '@/lib/repositories/followRepository'
import { getRecentlyViewedTickers } from '@/lib/repositories/activityRepository'
import { creators as mockCreators } from '@/lib/mock-data/creators'
import type { TasteProfile } from './types'

export function buildMockTasteProfile(userId: string): TasteProfile {
  const user = mockUsers.find(u => u.id === userId) ?? mockUsers[0]

  return {
    userId: user.id,
    genreIds: user.interests,
    spottedTickers: user.spottedTickers,
    followedCreatorTickers: [],   // follows not stored in mock users
    viewedTickers: getUserViewedTickers(user.id),
    searchedTerms: getUserSearchTerms(user.id),
  }
}

// Async builder that reads from Supabase with mock fallback
export async function buildTasteProfileAsync(userId: string): Promise<TasteProfile> {
  if (!IS_SUPABASE_ENABLED) return buildMockTasteProfile(userId)

  try {
    const [spottedCreatorIds, followedCreatorIds, viewedTickers] = await Promise.all([
      getSpottedCreatorIds(userId),
      getFollowedCreatorIds(userId),
      getRecentlyViewedTickers(userId, 20),
    ])

    // Resolve creator IDs → tickers using mock data as the lookup table
    const idToTicker = new Map(mockCreators.map(c => [c.id, c.ticker]))

    const spottedTickers = spottedCreatorIds
      .map(id => idToTicker.get(id))
      .filter((t): t is string => !!t)

    const followedCreatorTickers = followedCreatorIds
      .map(id => idToTicker.get(id))
      .filter((t): t is string => !!t)

    // Infer genre preferences from spotted/followed/viewed creators
    const { genres } = await import('@/lib/mock-data/genres')
    const relevantTickers = new Set([
      ...spottedTickers,
      ...followedCreatorTickers,
      ...viewedTickers,
    ])
    const genreScores = new Map<string, number>()
    for (const ticker of relevantTickers) {
      for (const genre of genres) {
        if (genre.creatorTickers.includes(ticker.toUpperCase())) {
          genreScores.set(genre.id, (genreScores.get(genre.id) ?? 0) + 1)
        }
      }
    }
    const genreIds = [...genreScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    return {
      userId,
      genreIds: genreIds.length > 0 ? genreIds : buildMockTasteProfile(userId).genreIds,
      spottedTickers,
      followedCreatorTickers,
      viewedTickers,
      searchedTerms: [],
    }
  } catch {
    return buildMockTasteProfile(userId)
  }
}

// Build a taste profile from raw data (used by API routes in Supabase mode)
export function buildTasteProfileFromData(
  userId: string,
  genreIds: string[],
  spottedTickers: string[],
  followedCreatorTickers: string[],
  viewedTickers: string[],
  searchedTerms: string[]
): TasteProfile {
  return {
    userId,
    genreIds,
    spottedTickers,
    followedCreatorTickers,
    viewedTickers,
    searchedTerms,
  }
}
