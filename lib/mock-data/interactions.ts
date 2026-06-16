// Seed interaction data — used by recommendation engine in mock mode.
// Represents views, searches, and cross-user signals across all 4 demo users.

export type InteractionType = 'view' | 'search' | 'spot' | 'follow'

export type MockInteraction = {
  userId: string
  ticker: string
  type: InteractionType
  daysAgo: number
  searchTerm?: string
}

export const mockInteractions: MockInteraction[] = [
  // khush — Punjabi / South Asian / Hip-Hop taste
  { userId: 'khush', ticker: 'APDHILLON',   type: 'view', daysAgo: 1 },
  { userId: 'khush', ticker: 'SHUBH',       type: 'view', daysAgo: 2 },
  { userId: 'khush', ticker: 'KARANAUJLA',  type: 'view', daysAgo: 3 },
  { userId: 'khush', ticker: 'HANUMANKIND', type: 'view', daysAgo: 1 },
  { userId: 'khush', ticker: 'PESOPLUMA',   type: 'view', daysAgo: 5 },
  { userId: 'khush', ticker: 'LILNASX',     type: 'view', daysAgo: 4 },
  { userId: 'khush', ticker: 'TYLERTC',     type: 'view', daysAgo: 7 },
  { userId: 'khush', ticker: 'HANUMANKIND', type: 'search', daysAgo: 2, searchTerm: 'hanumankind' },
  { userId: 'khush', ticker: 'SHUBH',       type: 'search', daysAgo: 6, searchTerm: 'shubh punjabi' },

  // maya — Pop / Fashion / Film taste
  { userId: 'maya', ticker: 'SABRINA',  type: 'view', daysAgo: 1 },
  { userId: 'maya', ticker: 'DOJACAT',  type: 'view', daysAgo: 1 },
  { userId: 'maya', ticker: 'NEWJEANS', type: 'view', daysAgo: 3 },
  { userId: 'maya', ticker: 'ICESPICE', type: 'view', daysAgo: 4 },
  { userId: 'maya', ticker: 'LILNASX',  type: 'view', daysAgo: 6 },
  { userId: 'maya', ticker: 'ICESPICE', type: 'search', daysAgo: 3, searchTerm: 'ice spice new album' },
  { userId: 'maya', ticker: 'NEWJEANS', type: 'search', daysAgo: 5, searchTerm: 'newjeans kpop' },

  // jordan — Hip-Hop / R&B / Electronic taste
  { userId: 'jordan', ticker: 'ICESPICE',  type: 'view', daysAgo: 1 },
  { userId: 'jordan', ticker: 'LILNASX',   type: 'view', daysAgo: 2 },
  { userId: 'jordan', ticker: 'WEEKND',    type: 'view', daysAgo: 3 },
  { userId: 'jordan', ticker: 'SZA',       type: 'view', daysAgo: 4 },
  { userId: 'jordan', ticker: 'DIPLO',     type: 'view', daysAgo: 5 },
  { userId: 'jordan', ticker: 'ICESPICE',  type: 'search', daysAgo: 2, searchTerm: 'ice spice collab' },
  { userId: 'jordan', ticker: 'WEEKND',    type: 'search', daysAgo: 4, searchTerm: 'weeknd new music' },

  // ariana — Indie / K-Pop / Film taste
  { userId: 'ariana', ticker: 'TYLERTC',   type: 'view', daysAgo: 1 },
  { userId: 'ariana', ticker: 'LILNASX',   type: 'view', daysAgo: 2 },
  { userId: 'ariana', ticker: 'NEWJEANS',  type: 'view', daysAgo: 3 },
  { userId: 'ariana', ticker: 'CORPSE',    type: 'view', daysAgo: 1 },
  { userId: 'ariana', ticker: 'HANUMANKIND', type: 'view', daysAgo: 4 },
  { userId: 'ariana', ticker: 'PESOPLUMA', type: 'view', daysAgo: 5 },
  { userId: 'ariana', ticker: 'DOJACAT',   type: 'view', daysAgo: 6 },
  { userId: 'ariana', ticker: 'CORPSE',    type: 'search', daysAgo: 2, searchTerm: 'corpse husband music' },
  { userId: 'ariana', ticker: 'TYLERTC',   type: 'search', daysAgo: 7, searchTerm: 'tyler creator chromakopia' },
]

export function getUserInteractions(userId: string): MockInteraction[] {
  return mockInteractions.filter(i => i.userId === userId)
}

export function getUserViewedTickers(userId: string): string[] {
  return mockInteractions
    .filter(i => i.userId === userId && i.type === 'view')
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .map(i => i.ticker)
}

export function getUserSearchTerms(userId: string): string[] {
  return mockInteractions
    .filter(i => i.userId === userId && i.type === 'search' && i.searchTerm)
    .map(i => i.searchTerm as string)
}
