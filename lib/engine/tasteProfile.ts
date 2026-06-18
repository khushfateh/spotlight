import { mockUsers } from '@/lib/mock-data/users'
import { getUserViewedTickers, getUserSearchTerms } from '@/lib/mock-data/interactions'
import { IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import { getSpottedCreatorIds, getRediscoveredCreatorIds } from '@/lib/repositories/spotRepository'
import { getFollowedCreatorIds } from '@/lib/repositories/followRepository'
import { getRecentlyViewedTickers } from '@/lib/repositories/activityRepository'
import { getUserGenreSlugs } from '@/lib/services/genreService'
import { creators as mockCreators } from '@/lib/mock-data/creators'
import type { TasteProfile } from './types'

export function buildMockTasteProfile(userId: string): TasteProfile {
  const user = mockUsers.find(u => u.id === userId) ?? mockUsers[0]

  return {
    userId: user.id,
    genreIds: user.interests,
    spottedTickers: user.spottedTickers,
    followedCreatorTickers: [],
    viewedTickers: getUserViewedTickers(user.id),
    searchedTerms: getUserSearchTerms(user.id),
    rediscoveredTickers: [],
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Async builder that reads from Supabase with mock fallback
export async function buildTasteProfileAsync(userId: string): Promise<TasteProfile> {
  // Don't query Supabase with non-UUID IDs (e.g. mock demo IDs like 'khush')
  if (!IS_SUPABASE_ENABLED || !UUID_RE.test(userId)) return buildMockTasteProfile(userId)

  try {
    const [spottedCreatorIds, followedCreatorIds, viewedTickers, savedGenreSlugs, rediscoveredCreatorIds] = await Promise.all([
      getSpottedCreatorIds(userId),
      getFollowedCreatorIds(userId),
      getRecentlyViewedTickers(userId, 20),
      getUserGenreSlugs(userId),
      getRediscoveredCreatorIds(userId),
    ])

    // Resolve creator IDs → tickers using mock data as the lookup table
    const idToTicker = new Map(mockCreators.map(c => [c.id, c.ticker]))

    const spottedTickers = spottedCreatorIds
      .map(id => idToTicker.get(id))
      .filter((t): t is string => !!t)

    const followedCreatorTickers = followedCreatorIds
      .map(id => idToTicker.get(id))
      .filter((t): t is string => !!t)

    // Infer additional genre preferences from activity (spots/follows/views)
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
    const activityGenreIds = [...genreScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    // Priority: explicit onboarding preferences → activity-inferred → mock fallback
    const mergedGenreIds = savedGenreSlugs.length > 0
      ? [...new Set([...savedGenreSlugs, ...activityGenreIds])]
      : activityGenreIds.length > 0
        ? activityGenreIds
        : buildMockTasteProfile(userId).genreIds

    const rediscoveredTickers = rediscoveredCreatorIds
      .map(id => idToTicker.get(id))
      .filter((t): t is string => !!t)

    return {
      userId,
      genreIds: mergedGenreIds,
      spottedTickers,
      followedCreatorTickers,
      viewedTickers,
      searchedTerms: [],
      rediscoveredTickers,
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
  searchedTerms: string[],
  rediscoveredTickers: string[] = []
): TasteProfile {
  return {
    userId,
    genreIds,
    spottedTickers,
    followedCreatorTickers,
    viewedTickers,
    searchedTerms,
    rediscoveredTickers,
  }
}
