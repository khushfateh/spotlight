import type { TasteProfile, CreatorSignal, DiscoverFilters } from './types'

export function scoreForHome(
  signal: CreatorSignal,
  profile: TasteProfile,
  similarUserTickers: Set<string>
): number {
  // 35% genre affinity
  const overlap = signal.genreIds.filter(g => profile.genreIds.includes(g)).length
  const genreAffinity = overlap > 0 ? Math.min(1, overlap / 2) : 0

  // 20% momentum — blended with Spotify streaming strength when available
  const rawMomentum = signal.momentumScore / 100
  const momentumFactor = signal.streamingStrength != null
    ? rawMomentum * 0.7 + signal.streamingStrength * 0.3
    : rawMomentum

  // 15% community spots
  const communityFactor = signal.communityInterest

  // 10% similar-user signal
  const similarUserFactor = similarUserTickers.has(signal.ticker) ? 1 : 0

  // 10% freshness
  const freshnessFactor = signal.freshness

  // 10% editorial
  const editorialFactor = signal.editorialBoost

  return (
    genreAffinity     * 0.35 +
    momentumFactor    * 0.20 +
    communityFactor   * 0.15 +
    similarUserFactor * 0.10 +
    freshnessFactor   * 0.10 +
    editorialFactor   * 0.10
  )
}

export function scoreForDiscover(
  signal: CreatorSignal,
  _filters: DiscoverFilters
): number {
  // More momentum-driven, less personalised, more velocity
  const velocityFactor = Math.max(0, Math.min(1, signal.momentumDelta / 15))
  return (
    (signal.momentumScore / 100) * 0.40 +
    velocityFactor               * 0.30 +
    signal.communityInterest     * 0.20 +
    signal.catalystStrength      * 0.10
  )
}

export function scoreForSpotlight(
  signal: CreatorSignal,
  profile: TasteProfile
): number {
  // Primary genre (index 0) match outweighs secondary/tertiary heavily
  const primaryGenre   = profile.genreIds[0]
  const secondaryGenre = profile.genreIds[1]
  let genreScore: number
  if (primaryGenre && signal.genreIds.includes(primaryGenre)) {
    genreScore = 1.0
  } else if (secondaryGenre && signal.genreIds.includes(secondaryGenre)) {
    genreScore = 0.6
  } else if (signal.genreIds.some(g => profile.genreIds.includes(g))) {
    genreScore = 0.2   // tertiary/quaternary match — weak signal
  } else {
    genreScore = 0.0
  }

  // Blend Spotify release activity into catalyst when available
  const adjustedCatalyst = signal.releaseActivity != null
    ? signal.catalystStrength * 0.7 + signal.releaseActivity * 0.3
    : signal.catalystStrength

  // Blend Spotify streaming strength into momentum when available
  const adjustedMomentum = signal.streamingStrength != null
    ? (signal.momentumScore / 100) * 0.7 + signal.streamingStrength * 0.3
    : signal.momentumScore / 100

  return (
    adjustedMomentum  * 0.25 +
    adjustedCatalyst  * 0.20 +
    signal.communityInterest * 0.15 +
    genreScore        * 0.40
  )
}

// Hidden gem: high momentum, low spot count (low platform notoriety)
export function scoreForHiddenGem(signal: CreatorSignal): number {
  const notoriety = Math.min(1, signal.spotCount / 50)
  return (signal.momentumScore / 100) * 0.60 +
    (1 - notoriety)                   * 0.25 +
    signal.freshness                  * 0.15
}
