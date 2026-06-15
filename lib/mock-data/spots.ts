// Early spotters — who discovered each creator and when
// This drives the social proof / "I was here first" mechanic on creator profiles

export type EarlySpotter = {
  userId: string
  userName: string
  userAvatar: string
  creatorTicker: string
  daysAgo: number
  badge?: string
}

export const earlySpots: EarlySpotter[] = [
  // AP Dhillon
  { userId: 'khush',  userName: 'Khush Fateh', userAvatar: 'KF', creatorTicker: 'APDHILLON', daysAgo: 174, badge: 'First 100' },
  { userId: 'priya',  userName: 'Priya Singh',  userAvatar: 'PS', creatorTicker: 'APDHILLON', daysAgo: 139 },
  { userId: 'dev',    userName: 'Dev Sharma',   userAvatar: 'DS', creatorTicker: 'APDHILLON', daysAgo: 102 },
  { userId: 'anika',  userName: 'Anika Rao',    userAvatar: 'AR', creatorTicker: 'APDHILLON', daysAgo: 87 },

  // MrBeast
  { userId: 'alex',   userName: 'Alex Park',    userAvatar: 'AP', creatorTicker: 'MRBEAST', daysAgo: 310, badge: 'OG Spotter' },
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'MRBEAST', daysAgo: 220 },
  { userId: 'sam',    userName: 'Sam Torres',   userAvatar: 'ST', creatorTicker: 'MRBEAST', daysAgo: 180 },

  // Shubh
  { userId: 'khush',  userName: 'Khush Fateh', userAvatar: 'KF', creatorTicker: 'SHUBH', daysAgo: 89, badge: 'First 50' },
  { userId: 'ravi',   userName: 'Ravi Kapoor',  userAvatar: 'RK', creatorTicker: 'SHUBH', daysAgo: 65 },
  { userId: 'aisha',  userName: 'Aisha Malik',  userAvatar: 'AM', creatorTicker: 'SHUBH', daysAgo: 51 },

  // Karan Aujla
  { userId: 'khush',  userName: 'Khush Fateh', userAvatar: 'KF', creatorTicker: 'KARANAUJLA', daysAgo: 156 },
  { userId: 'priya',  userName: 'Priya Singh',  userAvatar: 'PS', creatorTicker: 'KARANAUJLA', daysAgo: 121 },

  // Hanumankind
  { userId: 'khush',  userName: 'Khush Fateh', userAvatar: 'KF', creatorTicker: 'HANUMANKIND', daysAgo: 42, badge: 'First 10' },
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'HANUMANKIND', daysAgo: 31 },

  // Sabrina Carpenter
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'SABRINA', daysAgo: 198, badge: 'First 100' },
  { userId: 'taylor', userName: 'Taylor Moss',  userAvatar: 'TM', creatorTicker: 'SABRINA', daysAgo: 165 },
  { userId: 'jamie',  userName: 'Jamie Lin',    userAvatar: 'JL', creatorTicker: 'SABRINA', daysAgo: 140 },

  // Doja Cat
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'DOJACAT', daysAgo: 112 },
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'DOJACAT', daysAgo: 88 },

  // Kai Cenat
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'KAICENAT', daysAgo: 289 },
  { userId: 'marcus', userName: 'Marcus Webb',  userAvatar: 'MW', creatorTicker: 'KAICENAT', daysAgo: 241 },
  { userId: 'dev',    userName: 'Dev Sharma',   userAvatar: 'DS', creatorTicker: 'KAICENAT', daysAgo: 210 },

  // xQc
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'XQC', daysAgo: 312, badge: 'OG Spotter' },
  { userId: 'sam',    userName: 'Sam Torres',   userAvatar: 'ST', creatorTicker: 'XQC', daysAgo: 278 },

  // Pokimane
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'POKIMANE', daysAgo: 254 },
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'POKIMANE', daysAgo: 198 },

  // Ice Spice
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'ICESPICE', daysAgo: 67 },
  { userId: 'marcus', userName: 'Marcus Webb',  userAvatar: 'MW', creatorTicker: 'ICESPICE', daysAgo: 55 },

  // Tyler the Creator
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'TYLERTC', daysAgo: 91 },
  { userId: 'jamie',  userName: 'Jamie Lin',    userAvatar: 'JL', creatorTicker: 'TYLERTC', daysAgo: 74 },

  // Lil Nas X
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'LILNASX', daysAgo: 143 },
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'LILNASX', daysAgo: 119 },

  // NewJeans
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'NEWJEANS', daysAgo: 178 },
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'NEWJEANS', daysAgo: 145 },
  { userId: 'yuna',   userName: 'Yuna Park',    userAvatar: 'YP', creatorTicker: 'NEWJEANS', daysAgo: 132 },

  // Peso Pluma
  { userId: 'carlos', userName: 'Carlos Reyes', userAvatar: 'CR', creatorTicker: 'PESOPLUMA', daysAgo: 201, badge: 'First 50' },
  { userId: 'sam',    userName: 'Sam Torres',   userAvatar: 'ST', creatorTicker: 'PESOPLUMA', daysAgo: 167 },

  // Valkyrae
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'VALKYRAE', daysAgo: 189 },
  { userId: 'maya',   userName: 'Maya Patel',   userAvatar: 'MP', creatorTicker: 'VALKYRAE', daysAgo: 154 },

  // CORPSE Husband
  { userId: 'ariana', userName: 'Ariana Cruz',  userAvatar: 'AC', creatorTicker: 'CORPSE', daysAgo: 77 },

  // IShowSpeed
  { userId: 'jordan', userName: 'Jordan Kim',   userAvatar: 'JK', creatorTicker: 'SPEED', daysAgo: 201 },
  { userId: 'marcus', userName: 'Marcus Webb',  userAvatar: 'MW', creatorTicker: 'SPEED', daysAgo: 177 },
]

export function getEarlySpotters(ticker: string, limit = 3): EarlySpotter[] {
  return earlySpots
    .filter(s => s.creatorTicker === ticker.toUpperCase())
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .slice(0, limit)
}
