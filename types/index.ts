export type UserMode = 'investor' | 'creator'

export type Catalyst = {
  label: string
  date: string
  type: 'album' | 'tour' | 'collab' | 'content' | 'business' | 'appearance' | 'launch'
  impact: 'high' | 'medium'
}

export type CreatorCategory = 'Music' | 'Gaming' | 'Sports' | 'Content' | 'Lifestyle' | 'Podcast'

export type CreatorStatus = 'active' | 'ipo' | 'upcoming'

export type PricePoint = {
  date: string
  price: number
}

export type Creator = {
  id: string
  ticker: string
  name: string
  category: CreatorCategory
  bio: string
  avatar: string
  coverColor: string
  status: CreatorStatus
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  marketCap: number
  volume24h: number
  totalShares: number
  floatShares: number
  sharesHeld: number
  followers: string
  creatorScore: number
  socialHandles: {
    instagram?: string
    tiktok?: string
    youtube?: string
    spotify?: string
    twitch?: string
    twitter?: string
  }
  revenueMetrics: {
    streams?: string
    subscribers?: string
    monthlyListeners?: string
    viewsPerMonth?: string
    concertRevenue?: string
    festivalRevenue?: string
    merch?: string
  }
  priceHistory: PricePoint[]
  fundraisingGoal?: number
  fundraisingRaised?: number
  isVerified: boolean
  isWatched?: boolean
  imageUrl?: string
  story?: string
  catalysts?: Catalyst[]
}

export type IPOCreator = {
  id: string
  ticker: string
  name: string
  category: CreatorCategory
  bio: string
  avatar: string
  coverColor: string
  fundraisingGoal: number
  fundingProgress: number
  totalShares: number
  initialPrice: number
  launchDate: string
  pitch: string
  useOfFunds: string[]
  revenueStreams: string[]
  followers: string
  socialHandles: {
    instagram?: string
    tiktok?: string
    youtube?: string
    spotify?: string
    twitch?: string
  }
  status: 'waitlist' | 'open' | 'coming_soon'
  daysUntilLaunch?: number
  imageUrl?: string
}

export type Holding = {
  creatorId: string
  ticker: string
  name: string
  avatar: string
  coverColor: string
  shares: number
  avgBuyPrice: number
  currentPrice: number
  totalValue: number
  totalCost: number
  pnl: number
  pnlPercent: number
  momentumAtSpot: number  // momentum score at time of discovery
  spotDate: string        // ISO date string of when user spotted
  spotterRank: number     // ordinal rank at time of spot
}

export type Transaction = {
  id: string
  type: 'buy' | 'sell'
  ticker: string
  name: string
  shares: number
  price: number
  total: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

export type PortfolioSnapshot = {
  date: string
  value: number
}

export type Post = {
  id: string
  creatorId?: string
  authorName: string
  authorAvatar: string
  authorIsVerified: boolean
  content: string
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  timestamp: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export type Comment = {
  id: string
  postId: string
  authorName: string
  authorAvatar: string
  content: string
  likes: number
  timestamp: string
}

export type Notification = {
  id: string
  type: 'price_up' | 'price_down' | 'creator_update' | 'trade_executed' | 'new_ipo' | 'fundraising_closed'
  title: string
  message: string
  ticker?: string
  isRead: boolean
  timestamp: string
}

export type TradeOrder = {
  type: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  shares: number
  limitPrice?: number
  estimatedTotal: number
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y'
