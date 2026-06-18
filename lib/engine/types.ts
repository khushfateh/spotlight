export type TasteProfile = {
  userId: string
  genreIds: string[]
  spottedTickers: string[]
  followedCreatorTickers: string[]
  viewedTickers: string[]
  searchedTerms: string[]
  rediscoveredTickers: string[]   // creators the user has rediscovered at least once
}

export type CreatorSignal = {
  ticker: string
  genreIds: string[]
  momentumScore: number
  momentumDelta: number
  spotCount: number
  communityInterest: number   // 0–1
  catalystStrength: number    // 0–1
  freshness: number           // 0–1 (1 = very fresh/undiscovered)
  editorialBoost: number      // 0–1
  // Optional Spotify-derived signals — present only after provider enrichment
  streamingStrength?: number  // 0–1, from Spotify popularity + followers
  releaseActivity?: number    // 0–1, recency of latest release
}

export type ReasonType =
  | 'because_spotted'
  | 'genre_match'
  | 'similar_users'
  | 'trending'
  | 'editors_pick'
  | 'hidden_gem'
  | 'near_breakout'
  | 'rising_in_genre'

export type RankedCreator = {
  ticker: string
  score: number
  reasonType: ReasonType
  reason: string
}

export type DiscoverFilters = {
  lens?: 'trending' | 'rising' | 'breakout' | 'gems' | 'editors'
  genreId?: string
  category?: string
  query?: string
  limit?: number
}

export type SpotlightResult = {
  ticker: string
  reason: string
  story: string
  catalystLabel?: string
  momentumScore: number
  momentumTier: string
}

export interface CreatorDataProvider {
  readonly name: string
  getStreamingScore(ticker: string): Promise<number | null>
  getSocialScore(ticker: string): Promise<number | null>
  getNewsScore(ticker: string): Promise<number | null>
  getCatalystScore(ticker: string): Promise<number | null>
}
