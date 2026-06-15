import type { MockUser } from './users'

export type ReasonType =
  | 'because_spotted'
  | 'genre_match'
  | 'similar_users'
  | 'trending'
  | 'editors_pick'
  | 'hidden_gem'
  | 'near_breakout'
  | 'rising_in_genre'

export type Recommendation = {
  ticker: string
  reason: string
  reasonType: ReasonType
  sectionTitle?: string
}

export type HomeSection = {
  id: string
  title: string
  subtitle?: string
  reasonLabel?: string
  tickers: string[]
  layout: 'horizontal' | 'grid' | 'featured' | 'single'
  reasonType?: ReasonType
}

// Per-user recommendation configs
const userRecommendations: Record<string, HomeSection[]> = {
  khush: [
    {
      id: 'because-spotted-apdhillon',
      title: 'Because You Spotted AP Dhillon',
      subtitle: 'Creators in the same cultural lane',
      reasonLabel: 'Based on your early discovery',
      tickers: ['SHUBH', 'KARANAUJLA', 'PESOPLUMA', 'HANUMANKIND'],
      layout: 'horizontal',
      reasonType: 'because_spotted',
    },
    {
      id: 'rising-in-punjabi',
      title: 'Rising in Punjabi Music',
      subtitle: 'Biggest moves in your #1 genre this week',
      reasonLabel: 'Because you follow Punjabi Music',
      tickers: ['KARANAUJLA', 'HANUMANKIND', 'SHUBH'],
      layout: 'horizontal',
      reasonType: 'rising_in_genre',
    },
    {
      id: 'near-breakout',
      title: 'Near Breakout',
      subtitle: 'About to cross into the next momentum tier',
      tickers: ['HANUMANKIND', 'PESOPLUMA', 'ICESPICE'],
      layout: 'horizontal',
      reasonType: 'near_breakout',
    },
    {
      id: 'similar-users',
      title: 'Trending Among Spotters Like You',
      subtitle: 'People who spotted AP Dhillon also spotted...',
      reasonLabel: 'Collaborative discovery',
      tickers: ['LILNASX', 'TYLERTC', 'PESOPLUMA'],
      layout: 'horizontal',
      reasonType: 'similar_users',
    },
    {
      id: 'hidden-gem',
      title: 'Hidden Gem of the Day',
      subtitle: 'Under the radar, accelerating fast',
      tickers: ['HANUMANKIND'],
      layout: 'featured',
      reasonType: 'hidden_gem',
    },
  ],

  maya: [
    {
      id: 'because-spotted-sabrina',
      title: 'Because You Spotted Sabrina Carpenter',
      subtitle: 'Creators in the same pop universe',
      reasonLabel: 'Based on your early discovery',
      tickers: ['DOJACAT', 'NEWJEANS', 'ICESPICE', 'CHARLI'],
      layout: 'horizontal',
      reasonType: 'because_spotted',
    },
    {
      id: 'rising-in-pop',
      title: 'Rising in Pop',
      subtitle: 'Biggest momentum moves this week',
      reasonLabel: 'Because you follow Pop',
      tickers: ['NEWJEANS', 'ICESPICE', 'SABRINA'],
      layout: 'horizontal',
      reasonType: 'rising_in_genre',
    },
    {
      id: 'near-breakout',
      title: 'Near Breakout',
      subtitle: 'About to cross into the next tier',
      tickers: ['ICESPICE', 'NEWJEANS', 'HANUMANKIND'],
      layout: 'horizontal',
      reasonType: 'near_breakout',
    },
    {
      id: 'similar-users',
      title: 'Trending Among Spotters Like You',
      subtitle: 'Pop and fashion taste-makers are spotting...',
      tickers: ['VALKYRAE', 'POKIMANE', 'LILNASX'],
      layout: 'horizontal',
      reasonType: 'similar_users',
    },
    {
      id: 'hidden-gem',
      title: 'Hidden Gem of the Day',
      subtitle: 'Cult following. About to blow up.',
      tickers: ['NEWJEANS'],
      layout: 'featured',
      reasonType: 'hidden_gem',
    },
  ],

  jordan: [
    {
      id: 'because-spotted-xqc',
      title: 'Because You Spotted xQc',
      subtitle: 'Streaming-native creators on the rise',
      reasonLabel: 'Based on your early discovery',
      tickers: ['KAICENAT', 'VALKYRAE', 'SPEED', 'POKIMANE'],
      layout: 'horizontal',
      reasonType: 'because_spotted',
    },
    {
      id: 'rising-in-gaming',
      title: 'Rising in Gaming & Streaming',
      subtitle: 'Biggest moves in your scene this week',
      reasonLabel: 'Because you follow Gaming',
      tickers: ['KAICENAT', 'SPEED', 'VALKYRAE'],
      layout: 'horizontal',
      reasonType: 'rising_in_genre',
    },
    {
      id: 'near-breakout',
      title: 'Near Breakout',
      subtitle: 'Approaching Icon tier fast',
      tickers: ['KAICENAT', 'MRBEAST', 'SPEED'],
      layout: 'horizontal',
      reasonType: 'near_breakout',
    },
    {
      id: 'similar-users',
      title: 'Trending Among Spotters Like You',
      subtitle: 'Gaming and streaming spotters are watching...',
      tickers: ['MRBEAST', 'SIDEMEN', 'CORPSE'],
      layout: 'horizontal',
      reasonType: 'similar_users',
    },
    {
      id: 'hidden-gem',
      title: 'Hidden Gem of the Day',
      subtitle: 'The Bronx is back. And she\'s accelerating.',
      tickers: ['ICESPICE'],
      layout: 'featured',
      reasonType: 'hidden_gem',
    },
  ],

  ariana: [
    {
      id: 'because-spotted-tylertc',
      title: 'Because You Spotted Tyler the Creator',
      subtitle: 'Artistic creators pushing boundaries',
      reasonLabel: 'Based on your early discovery',
      tickers: ['LILNASX', 'CORPSE', 'HANUMANKIND', 'NEWJEANS'],
      layout: 'horizontal',
      reasonType: 'because_spotted',
    },
    {
      id: 'rising-in-indie',
      title: 'Rising in Indie & Alt',
      subtitle: 'Biggest underground momentum this week',
      reasonLabel: 'Because you follow Indie & Alt',
      tickers: ['TYLERTC', 'CORPSE', 'LILNASX'],
      layout: 'horizontal',
      reasonType: 'rising_in_genre',
    },
    {
      id: 'near-breakout',
      title: 'Near Breakout',
      subtitle: 'From cult to mainstream in real time',
      tickers: ['HANUMANKIND', 'NEWJEANS', 'PESOPLUMA'],
      layout: 'horizontal',
      reasonType: 'near_breakout',
    },
    {
      id: 'similar-users',
      title: 'Trending Among Spotters Like You',
      subtitle: 'Indie and film taste-makers are watching...',
      tickers: ['PESOPLUMA', 'ICESPICE', 'SABRINA'],
      layout: 'horizontal',
      reasonType: 'similar_users',
    },
    {
      id: 'hidden-gem',
      title: 'Hidden Gem of the Day',
      subtitle: 'Indian rap going global. Don\'t sleep.',
      tickers: ['HANUMANKIND'],
      layout: 'featured',
      reasonType: 'hidden_gem',
    },
  ],
}

export function getHomeSections(userId: string): HomeSection[] {
  return userRecommendations[userId] ?? userRecommendations['khush']
}

export const reasonTypeLabel: Record<ReasonType, string> = {
  because_spotted: 'Because you spotted this',
  genre_match: 'Based on your genres',
  similar_users: 'Trending among spotters like you',
  trending: 'Trending now',
  editors_pick: "Editor's pick",
  hidden_gem: 'Hidden gem',
  near_breakout: 'Near breakout',
  rising_in_genre: 'Rising in your genre',
}
