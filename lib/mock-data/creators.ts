import type { Creator, PricePoint } from '@/types'

function generatePriceHistory(
  basePrice: number,
  days: number,
  trend: 'up' | 'down' | 'volatile' | 'parabolic',
  endPrice: number
): PricePoint[] {
  const points: PricePoint[] = []
  const start = new Date('2025-09-15')
  let price = basePrice

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const progress = i / (days - 1)
    const target = basePrice + (endPrice - basePrice) * progress

    let noise = 0
    if (trend === 'volatile') noise = (Math.sin(i * 0.8) * basePrice * 0.06) + (Math.cos(i * 1.3) * basePrice * 0.03)
    else if (trend === 'parabolic') noise = Math.pow(progress, 2) * basePrice * 0.2 + (Math.sin(i * 0.5) * basePrice * 0.02)
    else if (trend === 'up') noise = Math.sin(i * 0.4) * basePrice * 0.04
    else noise = Math.cos(i * 0.5) * basePrice * 0.03

    price = Math.max(0.01, target + noise)

    points.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(3)),
    })
  }

  return points
}

export const creators: Creator[] = [
  {
    id: 'apdhillon',
    ticker: 'APDHILLON',
    name: 'AP Dhillon',
    category: 'Music',
    bio: 'Punjabi-Canadian sensation blending R&B and Punjabi pop. Toured globally, 10M+ monthly Spotify listeners, collaborations with Intense and Gurinder Gill.',
    avatar: 'AD',
    coverColor: 'from-purple-600 to-pink-600',
    status: 'active',
    price: 2.45,
    priceChange24h: 0.27,
    priceChangePercent24h: 12.35,
    marketCap: 2450000,
    volume24h: 184200,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 120000,
    followers: '14.2M',
    creatorScore: 84,
    socialHandles: {
      instagram: '@apdhillon',
      spotify: 'AP Dhillon',
      youtube: 'AP Dhillon Official',
    },
    revenueMetrics: {
      monthlyListeners: '10.2M',
      streams: '2.1B',
    },
    priceHistory: generatePriceHistory(0.85, 90, 'up', 2.45),
    isVerified: true,
    isWatched: true,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb4598d050?auto=format&fit=crop&w=800&q=85',
    story: 'North American tour sold out in 48 hours. Punjabi-Canadian icon breaking worldwide streaming records.',
    catalysts: [
      { label: 'World Tour Kickoff', date: 'Aug 2026', type: 'tour', impact: 'high' },
      { label: 'New Album Release', date: 'Jul 2026', type: 'album', impact: 'high' },
      { label: 'Coachella Headliner', date: 'Oct 2026', type: 'appearance', impact: 'medium' },
    ],
  },
  {
    id: 'mrbeast',
    ticker: 'MRBEAST',
    name: 'MrBeast',
    category: 'Content',
    bio: "World's most subscribed YouTube creator. Philanthropist, entrepreneur. Known for extreme challenges, viral giveaways, and Feastables.",
    avatar: 'MB',
    coverColor: 'from-green-500 to-emerald-700',
    status: 'active',
    price: 8.90,
    priceChange24h: 0.44,
    priceChangePercent24h: 5.20,
    marketCap: 8900000,
    volume24h: 523000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 185000,
    followers: '354M',
    creatorScore: 97,
    socialHandles: {
      youtube: 'MrBeast',
      instagram: '@mrbeast',
      tiktok: '@mrbeast',
    },
    revenueMetrics: {
      subscribers: '354M',
      viewsPerMonth: '800M',
    },
    priceHistory: generatePriceHistory(3.20, 90, 'up', 8.90),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    story: 'Last video hit 100M views in 72 hours. Feastables expansion into 15 new markets this quarter.',
    catalysts: [
      { label: 'MrBeast Games Launch', date: 'Aug 2026', type: 'launch', impact: 'high' },
      { label: 'Netflix Series Premiere', date: 'Sep 2026', type: 'content', impact: 'high' },
      { label: 'Feastables × Target', date: 'Jul 2026', type: 'business', impact: 'medium' },
    ],
  },
  {
    id: 'kaicenat',
    ticker: 'KAICENAT',
    name: 'Kai Cenat',
    category: 'Gaming',
    bio: 'Twitch record holder. Most subscribed Twitch streamer. AMP member. Known for high-energy streams, gaming, and viral NYC moments.',
    avatar: 'KC',
    coverColor: 'from-violet-600 to-purple-800',
    status: 'active',
    price: 3.20,
    priceChange24h: -0.07,
    priceChangePercent24h: -2.14,
    marketCap: 3200000,
    volume24h: 267000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 145000,
    followers: '65M',
    creatorScore: 88,
    socialHandles: {
      twitch: 'kaicenat',
      instagram: '@kaicenat',
      youtube: 'Kai Cenat',
    },
    revenueMetrics: {
      subscribers: '9.2M',
      viewsPerMonth: '120M',
    },
    priceHistory: generatePriceHistory(3.60, 90, 'volatile', 3.20),
    isVerified: true,
    isWatched: true,
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    story: 'AMP collab drove 9M new Twitch subs in 30 days. Most-subbed streamer for 8 consecutive months.',
  },
  {
    id: 'ishowspeed',
    ticker: 'SPEED',
    name: 'IShowSpeed',
    category: 'Gaming',
    bio: 'Global phenomenon known for explosive reactions, CR7 obsession, and viral moments. Rapidly expanding international fanbase.',
    avatar: 'IS',
    coverColor: 'from-red-500 to-orange-600',
    status: 'active',
    price: 1.80,
    priceChange24h: 0.57,
    priceChangePercent24h: 45.20,
    marketCap: 1800000,
    volume24h: 892000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 168000,
    followers: '42M',
    creatorScore: 79,
    socialHandles: {
      youtube: 'IShowSpeed',
      tiktok: '@ishowspeed',
    },
    revenueMetrics: {
      subscribers: '25M',
      viewsPerMonth: '200M',
    },
    priceHistory: generatePriceHistory(0.42, 90, 'parabolic', 1.80),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=800&q=80',
    story: 'Went viral in 18 countries simultaneously. Ronaldo collab passed 80M views in 7 days.',
    catalysts: [
      { label: 'World Tour Announcement', date: 'Sep 2026', type: 'tour', impact: 'high' },
      { label: 'FIFA Partnership Deal', date: 'Aug 2026', type: 'business', impact: 'high' },
      { label: 'New YouTube Series', date: 'Jul 2026', type: 'content', impact: 'medium' },
    ],
  },
  {
    id: 'pokimane',
    ticker: 'POKIMANE',
    name: 'Pokimane',
    category: 'Gaming',
    bio: 'Twitch pioneer and co-founder of Myna Snacks. First female streamer to reach 5M Twitch followers. Gaming and lifestyle content.',
    avatar: 'PK',
    coverColor: 'from-pink-400 to-rose-600',
    status: 'active',
    price: 2.80,
    priceChange24h: -0.04,
    priceChangePercent24h: -1.52,
    marketCap: 2800000,
    volume24h: 132000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 98000,
    followers: '21M',
    creatorScore: 81,
    socialHandles: {
      twitch: 'pokimane',
      instagram: '@pokimanelol',
      youtube: 'Pokimane',
    },
    revenueMetrics: {
      subscribers: '9.5M',
      viewsPerMonth: '45M',
    },
    priceHistory: generatePriceHistory(3.10, 90, 'volatile', 2.80),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    story: 'New Myna Snacks partnership with Walmart. Twitch record viewership during charity stream.',
  },
  {
    id: 'lilnasx',
    ticker: 'LILNASX',
    name: 'Lil Nas X',
    category: 'Music',
    bio: 'Grammy winner. Old Town Road broke Billboard records. Cultural icon blending country, hip-hop, and pop with fearless authenticity.',
    avatar: 'LN',
    coverColor: 'from-yellow-400 to-orange-500',
    status: 'active',
    price: 4.50,
    priceChange24h: 0.36,
    priceChangePercent24h: 8.70,
    marketCap: 4500000,
    volume24h: 213000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 142000,
    followers: '28M',
    creatorScore: 86,
    socialHandles: {
      instagram: '@lilnasx',
      spotify: 'Lil Nas X',
      youtube: 'Lil Nas X',
    },
    revenueMetrics: {
      monthlyListeners: '18.5M',
      streams: '8.2B',
    },
    priceHistory: generatePriceHistory(2.80, 90, 'up', 4.50),
    isVerified: true,
    isWatched: true,
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    story: 'Grammy winner. New album announcement sent streams up 340%. World tour selling fast.',
    catalysts: [
      { label: 'New Album Drop', date: 'Jul 2026', type: 'album', impact: 'high' },
      { label: 'World Tour Launch', date: 'Oct 2026', type: 'tour', impact: 'high' },
      { label: 'Versace Collab', date: 'Aug 2026', type: 'collab', impact: 'medium' },
    ],
  },
  {
    id: 'charli',
    ticker: 'CHARLI',
    name: 'Charli D\'Amelio',
    category: 'Content',
    bio: 'TikTok pioneer with the platform\'s first 100M followers. Dancer, entrepreneur, and reality TV star. Built a full lifestyle brand.',
    avatar: 'CD',
    coverColor: 'from-blue-400 to-cyan-500',
    status: 'active',
    price: 4.30,
    priceChange24h: 0.13,
    priceChangePercent24h: 3.12,
    marketCap: 4300000,
    volume24h: 158000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 112000,
    followers: '154M',
    creatorScore: 83,
    socialHandles: {
      tiktok: '@charlidamelio',
      instagram: '@charlidamelio',
      youtube: 'Charli D\'Amelio',
    },
    revenueMetrics: {
      subscribers: '10.3M',
      viewsPerMonth: '60M',
    },
    priceHistory: generatePriceHistory(3.20, 90, 'up', 4.30),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    story: 'First TikToker to 150M followers. World dance tour announced across 22 cities.',
  },
  {
    id: 'sidemen',
    ticker: 'SIDEMEN',
    name: 'Sidemen',
    category: 'Content',
    bio: 'UK\'s biggest creator group. KSI, Miniminter, Zerkaa, Behzinga, Vikkstar, Tobi & W2S. Sunday League football, charity matches, global brand.',
    avatar: 'SD',
    coverColor: 'from-slate-600 to-gray-800',
    status: 'active',
    price: 5.10,
    priceChange24h: 0.37,
    priceChangePercent24h: 7.82,
    marketCap: 5100000,
    volume24h: 289000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 178000,
    followers: '85M',
    creatorScore: 89,
    socialHandles: {
      youtube: 'Sidemen',
      instagram: '@sidemen',
    },
    revenueMetrics: {
      subscribers: '28M',
      viewsPerMonth: '150M',
    },
    priceHistory: generatePriceHistory(3.00, 90, 'up', 5.10),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=800&q=80',
    story: 'Sunday League charity match broke YouTube Sports records with 9M concurrent viewers.',
  },
  {
    id: 'corpse',
    ticker: 'CORPSE',
    name: 'CORPSE Husband',
    category: 'Music',
    bio: 'Faceless mystery creator. Deep voice became a cultural phenomenon. Horror storytelling turned musician. Among Us era breakout star.',
    avatar: 'CH',
    coverColor: 'from-gray-800 to-black',
    status: 'active',
    price: 1.20,
    priceChange24h: 0.22,
    priceChangePercent24h: 22.47,
    marketCap: 1200000,
    volume24h: 412000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 76000,
    followers: '18M',
    creatorScore: 74,
    socialHandles: {
      youtube: 'CORPSE Husband',
      spotify: 'CORPSE',
    },
    revenueMetrics: {
      monthlyListeners: '3.2M',
    },
    priceHistory: generatePriceHistory(0.50, 90, 'parabolic', 1.20),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1527203561368-7521bf25ae49?auto=format&fit=crop&w=800&q=80',
    story: 'New single crossed 5M plays in 24 hours. Mystery persona driving record community engagement.',
  },
  {
    id: 'valkyrae',
    ticker: 'VALKYRAE',
    name: 'Valkyrae',
    category: 'Gaming',
    bio: '2021 YouTube Gaming Creator of the Year. 100 Thieves co-owner. One of the most-watched female streamers globally.',
    avatar: 'VK',
    coverColor: 'from-teal-500 to-cyan-700',
    status: 'active',
    price: 1.90,
    priceChange24h: 0.25,
    priceChangePercent24h: 15.29,
    marketCap: 1900000,
    volume24h: 198000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 88000,
    followers: '12M',
    creatorScore: 76,
    socialHandles: {
      youtube: 'Valkyrae',
      instagram: '@valkyrae',
    },
    revenueMetrics: {
      subscribers: '4.1M',
      viewsPerMonth: '25M',
    },
    priceHistory: generatePriceHistory(0.90, 90, 'up', 1.90),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    story: 'YouTube Gaming Creator of the Year for second time. 100 Thieves esports expansion into new leagues.',
  },
  {
    id: 'pewdiepie',
    ticker: 'PDPIE',
    name: 'PewDiePie',
    category: 'Gaming',
    bio: 'The OG. First individual creator to hit 100M subscribers. Swedish gaming legend, meme creator, now living a more chill life in Japan.',
    avatar: 'PP',
    coverColor: 'from-red-700 to-red-900',
    status: 'active',
    price: 3.40,
    priceChange24h: -0.03,
    priceChangePercent24h: -0.82,
    marketCap: 3400000,
    volume24h: 89000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 92000,
    followers: '111M',
    creatorScore: 80,
    socialHandles: {
      youtube: 'PewDiePie',
      instagram: '@pewdiepie',
    },
    revenueMetrics: {
      subscribers: '111M',
      viewsPerMonth: '40M',
    },
    priceHistory: generatePriceHistory(3.80, 90, 'down', 3.40),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    story: 'Gaming comeback video hit 20M views in a week. Minecraft series revival driving new subscriber wave.',
  },
  {
    id: 'drdisrespect',
    ticker: 'DRDIS',
    name: 'Dr Disrespect',
    category: 'Gaming',
    bio: 'Two-time champion. Champion\'s Club leader. Notorious for high-energy gameplay and iconic persona. Building his own game studio.',
    avatar: 'DD',
    coverColor: 'from-yellow-600 to-yellow-800',
    status: 'active',
    price: 0.95,
    priceChange24h: -0.05,
    priceChangePercent24h: -5.24,
    marketCap: 950000,
    volume24h: 67000,
    totalShares: 1000000,
    floatShares: 200000,
    sharesHeld: 55000,
    followers: '4M',
    creatorScore: 68,
    socialHandles: {
      youtube: 'Dr Disrespect',
      instagram: '@drdisrespect',
    },
    revenueMetrics: {
      subscribers: '4.2M',
      viewsPerMonth: '15M',
    },
    priceHistory: generatePriceHistory(1.30, 90, 'down', 0.95),
    isVerified: true,
    isWatched: false,
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
    story: 'Slimezone game studio enters alpha with 500K wishlists. Champion\'s Club membership up 30%.',
  },
]

export function getCreatorByTicker(ticker: string): Creator | undefined {
  return creators.find(c => c.ticker.toLowerCase() === ticker.toLowerCase())
}

export function getTrendingCreators(limit = 6): Creator[] {
  return [...creators]
    .sort((a, b) => Math.abs(b.priceChangePercent24h) - Math.abs(a.priceChangePercent24h))
    .slice(0, limit)
}

export function getTopGainers(limit = 5): Creator[] {
  return [...creators]
    .filter(c => c.priceChangePercent24h > 0)
    .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
    .slice(0, limit)
}

export function getTopLosers(limit = 5): Creator[] {
  return [...creators]
    .filter(c => c.priceChangePercent24h < 0)
    .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
    .slice(0, limit)
}

export function getCreatorsByCategory(category: string): Creator[] {
  if (category === 'All') return creators
  return creators.filter(c => c.category === category)
}
