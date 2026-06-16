export type MockUser = {
  id: string
  name: string
  username: string
  avatar: string
  initials: string
  bio: string
  interests: string[]       // genre ids
  spottedTickers: string[]  // creator tickers this user has spotted
  discoveryScore: number    // 0–100
  creatorsSpotted: number
  breakoutsIdentified: number
  avgLeadDays: number
  momentumAccuracy: number
  discoveryRank: string
  badges: string[]
  joinedDaysAgo: number
  coverColor: string
}

export const mockUsers: MockUser[] = [
  {
    id: 'khush',
    name: 'Khush Fateh',
    username: '@khushfateh',
    avatar: 'KF',
    initials: 'KF',
    bio: 'Early spotter in Punjabi music & South Asian culture. Found AP Dhillon before the world caught up.',
    interests: ['punjabi-music', 'hip-hop', 'south-asian-culture', 'content'],
    spottedTickers: ['APDHILLON', 'SHUBH', 'KARANAUJLA', 'HANUMANKIND'],
    discoveryScore: 87,
    creatorsSpotted: 4,
    breakoutsIdentified: 3,
    avgLeadDays: 174,
    momentumAccuracy: 89,
    discoveryRank: 'Top 8%',
    badges: ['Early Spotter', 'Culture Scout', 'South Asian Pioneer'],
    joinedDaysAgo: 210,
    coverColor: 'from-orange-500 to-pink-600',
  },
  {
    id: 'maya',
    name: 'Maya Patel',
    username: '@mayadisc',
    avatar: 'MP',
    initials: 'MP',
    bio: 'Pop culture obsessive. Spotted Sabrina Carpenter before the Espresso era.',
    interests: ['pop', 'fashion', 'film'],
    spottedTickers: ['SABRINA', 'DOJACAT', 'NEWJEANS'],
    discoveryScore: 74,
    creatorsSpotted: 4,
    breakoutsIdentified: 2,
    avgLeadDays: 112,
    momentumAccuracy: 78,
    discoveryRank: 'Top 18%',
    badges: ['Trend Hunter', 'Early Spotter'],
    joinedDaysAgo: 145,
    coverColor: 'from-pink-500 to-purple-600',
  },
  {
    id: 'jordan',
    name: 'Jordan Kim',
    username: '@jordanspots',
    avatar: 'JK',
    initials: 'JK',
    bio: 'Music discovery native. Found IceSpice before the mainstream caught up.',
    interests: ['hip-hop', 'r-and-b', 'electronic'],
    spottedTickers: ['ICESPICE', 'LILNASX', 'WEEKND'],
    discoveryScore: 91,
    creatorsSpotted: 5,
    breakoutsIdentified: 4,
    avgLeadDays: 231,
    momentumAccuracy: 93,
    discoveryRank: 'Top 3%',
    badges: ['Top Discoverer', 'Stream Pioneer', 'Early Believer'],
    joinedDaysAgo: 320,
    coverColor: 'from-violet-600 to-indigo-800',
  },
  {
    id: 'ariana',
    name: 'Ariana Cruz',
    username: '@arianafinds',
    avatar: 'AC',
    initials: 'AC',
    bio: 'Indie ear. Tyler and NewJeans when they were underground. Film photography on weekends.',
    interests: ['indie-alt', 'hip-hop', 'film', 'k-pop'],
    spottedTickers: ['TYLERTC', 'LILNASX', 'NEWJEANS', 'CORPSE'],
    discoveryScore: 68,
    creatorsSpotted: 4,
    breakoutsIdentified: 2,
    avgLeadDays: 89,
    momentumAccuracy: 71,
    discoveryRank: 'Top 24%',
    badges: ['Culture Scout', 'Hidden Gem Hunter'],
    joinedDaysAgo: 98,
    coverColor: 'from-gray-700 to-slate-800',
  },
]

export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find(u => u.id === id)
}

export const DEMO_USER_ID = 'khush'
