import { creators } from '@/lib/mock-data/creators'
import { genres } from '@/lib/mock-data/genres'
import { mockUsers } from '@/lib/mock-data/users'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { buildTasteProfileAsync } from '@/lib/engine/tasteProfile'
import { buildAllCreatorSignals } from '@/lib/engine/creatorSignals'
import { scoreForHome, scoreForSpotlight, scoreForHiddenGem } from '@/lib/engine/ranking'
import { getExplanation } from '@/lib/engine/explanations'
import type {
  TasteProfile,
  CreatorSignal,
  DiscoverFilters,
  SpotlightResult,
} from '@/lib/engine/types'
import type { HomeSection } from '@/lib/mock-data/recommendations'
import type { Creator } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────


function excludeSpotted(tickers: string[], profile: TasteProfile): string[] {
  const spotted = new Set(profile.spottedTickers.map(t => t.toUpperCase()))
  return tickers.filter(t => !spotted.has(t.toUpperCase()))
}

function getSimilarUserTickers(profile: TasteProfile): Set<string> {
  const result = new Set<string>()
  for (const user of mockUsers) {
    if (user.id === profile.userId) continue
    const sharedSpots = user.spottedTickers.filter(t =>
      profile.spottedTickers.map(s => s.toUpperCase()).includes(t.toUpperCase())
    )
    const sharedGenres = user.interests.filter(g => profile.genreIds.includes(g))
    if (sharedSpots.length > 0 || sharedGenres.length >= 2) {
      for (const t of user.spottedTickers) result.add(t.toUpperCase())
    }
  }
  return result
}

function topN(
  signals: CreatorSignal[],
  scorer: (s: CreatorSignal) => number,
  n: number
): string[] {
  return [...signals]
    .sort((a, b) => scorer(b) - scorer(a))
    .slice(0, n)
    .map(s => s.ticker)
}

// ── Core exported functions ───────────────────────────────────────────────────

export async function getPersonalizedHome(userId: string): Promise<HomeSection[]> {
  const profile = await buildTasteProfileAsync(userId)
  const allSignals = buildAllCreatorSignals()
  const signalList = [...allSignals.values()]
  const similarTickers = getSimilarUserTickers(profile)
  const sections: HomeSection[] = []

  // 1. Because You Spotted <top creator>
  if (profile.spottedTickers.length > 0) {
    const topSpottedTicker = profile.spottedTickers[0].toUpperCase()
    const spottedCreator = creators.find(c => c.ticker.toUpperCase() === topSpottedTicker)
    const spottedGenreIds = genres
      .filter(g => g.creatorTickers.includes(topSpottedTicker))
      .map(g => g.id)

    const relatedTickers = excludeSpotted(
      topN(
        signalList.filter(s => s.genreIds.some(g => spottedGenreIds.includes(g))),
        s => scoreForHome(s, profile, similarTickers),
        5
      ),
      profile
    )

    if (relatedTickers.length >= 2 && spottedCreator) {
      sections.push({
        id: 'because-spotted-' + topSpottedTicker.toLowerCase(),
        title: 'Because You Spotted ' + spottedCreator.name,
        subtitle: 'Creators in the same cultural lane',
        reasonLabel: 'Based on your early discovery',
        tickers: relatedTickers,
        layout: 'horizontal',
        reasonType: 'because_spotted',
      })
    }
  }

  // 2. Rising in top genre
  if (profile.genreIds.length > 0) {
    const topGenreId = profile.genreIds[0]
    const topGenre = genres.find(g => g.id === topGenreId)
    if (topGenre) {
      const risingTickers = excludeSpotted(
        topN(
          signalList.filter(s => s.genreIds.includes(topGenreId) && s.momentumDelta > 0),
          s => s.momentumDelta,
          4
        ),
        profile
      )
      if (risingTickers.length >= 2) {
        sections.push({
          id: 'rising-in-' + topGenreId,
          title: 'Rising in ' + topGenre.label,
          subtitle: 'Biggest moves in your #1 genre this week',
          reasonLabel: 'Because you follow ' + topGenre.label,
          tickers: risingTickers,
          layout: 'horizontal',
          reasonType: 'rising_in_genre',
        })
      }
    }
  }

  // 3. Near Breakout (momentum 60–84, delta >= 5)
  const nearBreakoutTickers = excludeSpotted(
    topN(
      signalList.filter(s => s.momentumScore >= 60 && s.momentumScore < 85 && s.momentumDelta >= 5),
      s => s.momentumDelta,
      4
    ),
    profile
  )
  if (nearBreakoutTickers.length >= 2) {
    sections.push({
      id: 'near-breakout',
      title: 'Near Breakout',
      subtitle: 'About to cross into the next momentum tier',
      tickers: nearBreakoutTickers,
      layout: 'horizontal',
      reasonType: 'near_breakout',
    })
  }

  // 4. Trending Among Similar Users
  const similarExclusive = excludeSpotted(
    topN(
      signalList.filter(s => similarTickers.has(s.ticker)),
      s => scoreForHome(s, profile, similarTickers),
      4
    ),
    profile
  )
  if (similarExclusive.length >= 2) {
    sections.push({
      id: 'similar-users',
      title: 'Trending Among Spotters Like You',
      subtitle: 'Users with similar taste are spotting…',
      reasonLabel: 'Collaborative discovery',
      tickers: similarExclusive,
      layout: 'horizontal',
      reasonType: 'similar_users',
    })
  }

  // 5. Because You Rediscovered (rediscovery signal — genre-adjacent creators)
  if (profile.rediscoveredTickers.length > 0) {
    const rediscoveredGenreIds = new Set<string>()
    for (const ticker of profile.rediscoveredTickers) {
      for (const genre of genres) {
        if (genre.creatorTickers.includes(ticker.toUpperCase())) {
          rediscoveredGenreIds.add(genre.id)
        }
      }
    }
    const rediscoveredRelatedTickers = excludeSpotted(
      topN(
        signalList.filter(s =>
          s.genreIds.some(g => rediscoveredGenreIds.has(g)) &&
          !profile.rediscoveredTickers.includes(s.ticker)
        ),
        s => scoreForHome(s, profile, similarTickers),
        4
      ),
      profile
    )
    if (rediscoveredRelatedTickers.length >= 2) {
      sections.push({
        id: 'because-rediscovered',
        title: 'Because You Rediscovered',
        subtitle: 'Creators in the lane of your returning discoveries',
        reasonLabel: 'Rediscovery signal',
        tickers: rediscoveredRelatedTickers,
        layout: 'horizontal',
        reasonType: 'because_spotted',
      })
    }
  }

  // 6. Hidden Gem (low spot count, high momentum)
  const gemCandidates = signalList.filter(s => {
    return s.spotCount <= 3 && s.momentumScore >= 58
  })
  const gemTickers = excludeSpotted(
    topN(gemCandidates, s => scoreForHiddenGem(s), 1),
    profile
  )
  if (gemTickers.length > 0) {
    const gemCreator = creators.find(c => c.ticker.toUpperCase() === gemTickers[0])
    sections.push({
      id: 'hidden-gem',
      title: 'Hidden Gem of the Day',
      subtitle: gemCreator?.story ?? 'Under the radar, accelerating fast',
      tickers: gemTickers,
      layout: 'featured',
      reasonType: 'hidden_gem',
    })
  }

  return sections
}

export async function getBecauseYouLike(userId: string, genreId: string): Promise<HomeSection | null> {
  const profile = await buildTasteProfileAsync(userId)
  const allSignals = buildAllCreatorSignals()
  const genre = genres.find(g => g.id === genreId)
  if (!genre) return null

  const tickers = excludeSpotted(
    topN(
      [...allSignals.values()].filter(s => s.genreIds.includes(genreId)),
      s => s.momentumScore,
      6
    ),
    profile
  )

  if (tickers.length === 0) return null
  return {
    id: 'genre-' + genreId,
    title: 'Because You Like ' + genre.label,
    subtitle: 'Top creators in this genre right now',
    tickers,
    layout: 'horizontal',
    reasonType: 'genre_match',
  }
}

export async function getSimilarToSpotted(userId: string): Promise<HomeSection | null> {
  const profile = await buildTasteProfileAsync(userId)
  if (profile.spottedTickers.length === 0) return null

  const allSignals = buildAllCreatorSignals()
  const signalList = [...allSignals.values()]
  const similarTickers = getSimilarUserTickers(profile)

  const tickers = excludeSpotted(
    topN(
      signalList.filter(s => similarTickers.has(s.ticker)),
      s => s.momentumScore,
      5
    ),
    profile
  )

  if (tickers.length === 0) return null
  return {
    id: 'similar-to-spotted',
    title: 'Similar to Creators You Spotted',
    subtitle: 'Discovered by spotters who spotted the same creators as you',
    tickers,
    layout: 'horizontal',
    reasonType: 'similar_users',
  }
}

export async function getTrendingAmongSimilarUsers(userId: string): Promise<HomeSection | null> {
  const profile = await buildTasteProfileAsync(userId)
  const similarTickers = getSimilarUserTickers(profile)
  const allSignals = buildAllCreatorSignals()

  const tickers = excludeSpotted(
    topN(
      [...allSignals.values()].filter(s => similarTickers.has(s.ticker)),
      s => s.momentumScore * s.communityInterest,
      5
    ),
    profile
  )

  if (tickers.length === 0) return null
  return {
    id: 'trending-similar-users',
    title: 'Trending Among Spotters Like You',
    subtitle: 'Collaborative discovery signal',
    tickers,
    layout: 'horizontal',
    reasonType: 'similar_users',
  }
}

export async function getHiddenGems(userId: string): Promise<HomeSection | null> {
  const profile = await buildTasteProfileAsync(userId)
  const allSignals = buildAllCreatorSignals()

  const tickers = excludeSpotted(
    topN(
      [...allSignals.values()].filter(s => {
        return s.spotCount <= 3 && s.momentumScore >= 55
      }),
      s => scoreForHiddenGem(s),
      4
    ),
    profile
  )

  if (tickers.length === 0) return null
  return {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    subtitle: 'Under the radar. Accelerating fast.',
    tickers,
    layout: 'horizontal',
    reasonType: 'hidden_gem',
  }
}

export async function getRisingFast(userId: string): Promise<HomeSection | null> {
  const profile = await buildTasteProfileAsync(userId)
  const allSignals = buildAllCreatorSignals()

  const tickers = excludeSpotted(
    topN(
      [...allSignals.values()].filter(s => s.momentumDelta >= 5),
      s => s.momentumDelta,
      5
    ),
    profile
  )

  if (tickers.length === 0) return null
  return {
    id: 'rising-fast',
    title: 'Rising Fast',
    subtitle: 'Biggest momentum gains this week',
    tickers,
    layout: 'horizontal',
    reasonType: 'trending',
  }
}

export async function getDailySpotlight(userId: string): Promise<SpotlightResult | null> {
  const profile = await buildTasteProfileAsync(userId)
  const allSignals = buildAllCreatorSignals()

  // Pick best creator for spotlight: not already spotted, has story + catalysts
  const eligible = [...allSignals.values()].filter(s => {
    const c = creators.find(cr => cr.ticker.toUpperCase() === s.ticker)
    return c && (c.story || (c.catalysts?.length ?? 0) > 0) && !profile.spottedTickers.includes(s.ticker)
  })

  // Prefer creators that share at least one genre with the user — fall back to all if empty
  const withGenreMatch = eligible.filter(s =>
    s.genreIds.some(g => profile.genreIds.includes(g))
  )
  const candidates = (withGenreMatch.length > 0 ? withGenreMatch : eligible)
    .sort((a, b) => scoreForSpotlight(b, profile) - scoreForSpotlight(a, profile))

  if (candidates.length === 0) return null
  const top = candidates[0]
  const creator = creators.find(c => c.ticker.toUpperCase() === top.ticker)
  if (!creator) return null

  const mData = getMomentum(top.ticker)
  const tier = getMomentumTier(mData.score)
  const topCatalyst = creator.catalysts?.find(c => c.impact === 'high')

  return {
    ticker: top.ticker,
    reason: getExplanation(top.ticker, top, profile, 'editors_pick'),
    story: creator.story ?? '',
    catalystLabel: topCatalyst?.label,
    momentumScore: mData.score,
    momentumTier: tier,
  }
}

export async function getDiscoverResults(filters: DiscoverFilters): Promise<Creator[]> {
  const allSignals = buildAllCreatorSignals()
  let pool = [...allSignals.values()]

  // Apply genre filter
  if (filters.genreId) {
    pool = pool.filter(s => s.genreIds.includes(filters.genreId!))
  }

  // Apply category filter
  if (filters.category) {
    const cat = filters.category
    const catTickers = new Set(
      creators.filter(c => c.category === cat).map(c => c.ticker.toUpperCase())
    )
    pool = pool.filter(s => catTickers.has(s.ticker))
  }

  // Apply lens
  switch (filters.lens) {
    case 'trending':
      pool = pool.sort((a, b) => b.momentumScore - a.momentumScore)
      break
    case 'rising':
      pool = pool.filter(s => s.momentumDelta > 0).sort((a, b) => b.momentumDelta - a.momentumDelta)
      break
    case 'breakout':
      pool = pool.filter(s => s.momentumScore >= 60 && s.momentumScore < 85 && s.momentumDelta >= 3)
        .sort((a, b) => b.momentumDelta - a.momentumDelta)
      break
    case 'gems': {
      pool = pool.filter(s => {
        return s.spotCount <= 3 && s.momentumScore >= 55
      }).sort((a, b) => scoreForHiddenGem(b) - scoreForHiddenGem(a))
      break
    }
    case 'editors':
      pool = pool.filter(s => s.catalystStrength > 0.5)
        .sort((a, b) => b.catalystStrength - a.catalystStrength)
      break
    default:
      pool = pool.sort((a, b) => b.momentumScore - a.momentumScore)
  }

  // Apply search query
  if (filters.query) {
    const q = filters.query.toLowerCase()
    const matches = creators.filter(c =>
      c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q)
    ).map(c => c.ticker.toUpperCase())
    pool = pool.filter(s => matches.includes(s.ticker))
  }

  const limit = filters.limit ?? 20
  const resultTickers = pool.slice(0, limit).map(s => s.ticker)
  return creators.filter(c => resultTickers.includes(c.ticker.toUpperCase()))
}
