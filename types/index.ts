export type UserMode = 'investor' | 'creator'

export type Catalyst = {
  label: string
  date: string
  type: 'album' | 'tour' | 'collab' | 'content' | 'business' | 'appearance' | 'launch'
  impact: 'high' | 'medium'
}

export type CreatorCategory = 'Music' | 'Gaming' | 'Sports' | 'Content' | 'Lifestyle' | 'Podcast'

export type Creator = {
  id: string
  ticker: string
  name: string
  category: CreatorCategory
  bio: string
  avatar: string
  coverColor: string
  creatorScore: number
  socialHandles: {
    instagram?: string
    tiktok?: string
    youtube?: string
    spotify?: string
    twitch?: string
    twitter?: string
  }
  isWatched?: boolean
  imageUrl?: string
  story?: string
  catalysts?: Catalyst[]
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
