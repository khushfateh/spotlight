import { creators } from '@/lib/mock-data/creators'
import { genres } from '@/lib/mock-data/genres'
import { MOMENTUM, getMomentumTier } from '@/lib/mock-data/momentum'
import type { TasteProfile, CreatorSignal, ReasonType } from './types'

export function getExplanation(
  ticker: string,
  signal: CreatorSignal,
  profile: TasteProfile,
  reasonType: ReasonType
): string {
  const mData = MOMENTUM[ticker.toUpperCase()] ?? { score: 50, delta: 0 }
  const tier = getMomentumTier(mData.score)

  switch (reasonType) {
    case 'because_spotted': {
      const pivotTicker = profile.spottedTickers.find(t => {
        const tGenres = genres.filter(g => g.creatorTickers.includes(t.toUpperCase())).map(g => g.id)
        return tGenres.some(g => signal.genreIds.includes(g))
      })
      const pivotName = pivotTicker
        ? (creators.find(c => c.ticker.toUpperCase() === pivotTicker.toUpperCase())?.name ?? pivotTicker)
        : null
      return pivotName
        ? 'Because you spotted ' + pivotName
        : 'Based on your early discovery taste'
    }
    case 'genre_match': {
      const matchedGenre = genres.find(g =>
        signal.genreIds.includes(g.id) && profile.genreIds.includes(g.id)
      )
      return matchedGenre
        ? 'Because you like ' + matchedGenre.label
        : 'Based on your taste profile'
    }
    case 'similar_users':
      return 'Trending among spotters with similar taste'
    case 'trending':
      return 'Trending now · ' + tier + ' tier'
    case 'editors_pick':
      return "Editor's pick · " + tier + ' momentum'
    case 'hidden_gem':
      return 'Hidden gem · high momentum, low spotlight'
    case 'near_breakout': {
      const delta = mData.delta
      return 'Near breakout · +' + delta + ' pts this week'
    }
    case 'rising_in_genre': {
      const matchedGenre = genres.find(g =>
        signal.genreIds.includes(g.id) && profile.genreIds.includes(g.id)
      )
      return matchedGenre
        ? 'Rising fast in ' + matchedGenre.label
        : 'Rising fast in your top genre'
    }
    default:
      return 'Recommended for you'
  }
}

export const reasonTypeLabel: Record<ReasonType, string> = {
  because_spotted:  'Because you spotted this',
  genre_match:      'Based on your genres',
  similar_users:    'Trending among spotters like you',
  trending:         'Trending now',
  editors_pick:     "Editor's pick",
  hidden_gem:       'Hidden gem',
  near_breakout:    'Near breakout',
  rising_in_genre:  'Rising in your genre',
}
