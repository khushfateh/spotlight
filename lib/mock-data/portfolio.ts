import type { Holding, Transaction, PortfolioSnapshot } from '@/types'

export const holdings: Holding[] = [
  {
    creatorId: 'apdhillon',
    ticker: 'APDHILLON',
    name: 'AP Dhillon',
    avatar: 'AD',
    coverColor: 'from-purple-600 to-pink-600',
    shares: 500,
    avgBuyPrice: 1.05,
    currentPrice: 2.45,
    totalValue: 1225.00,
    totalCost: 525.00,
    pnl: 700.00,
    pnlPercent: 133.33,
    momentumAtSpot: 45,
    spotDate: '2025-12-24T14:32:00Z',
    spotterRank: 41,
  },
  {
    creatorId: 'lilnasx',
    ticker: 'LILNASX',
    name: 'Lil Nas X',
    avatar: 'LN',
    coverColor: 'from-yellow-400 to-orange-500',
    shares: 150,
    avgBuyPrice: 3.20,
    currentPrice: 4.50,
    totalValue: 675.00,
    totalCost: 480.00,
    pnl: 195.00,
    pnlPercent: 40.63,
    momentumAtSpot: 58,
    spotDate: '2026-01-14T09:15:00Z',
    spotterRank: 86,
  },
]

export const totalPortfolioValue = holdings.reduce((s, h) => s + h.totalValue, 0)
export const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
export const totalPnl = totalPortfolioValue - totalCost
export const totalPnlPercent = (totalPnl / totalCost) * 100

export const portfolioHistory: PortfolioSnapshot[] = [
  { date: 'Sep 15', value: 2485 },
  { date: 'Sep 22', value: 2620 },
  { date: 'Sep 29', value: 2550 },
  { date: 'Oct 6', value: 2890 },
  { date: 'Oct 13', value: 3120 },
  { date: 'Oct 20', value: 2980 },
  { date: 'Oct 27', value: 3340 },
  { date: 'Nov 3', value: 3560 },
  { date: 'Nov 10', value: 3820 },
  { date: 'Nov 17', value: 3720 },
  { date: 'Nov 24', value: 4050 },
  { date: 'Dec 1', value: 4380 },
  { date: 'Dec 8', value: 4620 },
  { date: 'Dec 15', value: 4480 },
  { date: 'Dec 22', value: 4850 },
  { date: 'Dec 29', value: 5100 },
  { date: 'Jan 5', value: 4920 },
  { date: 'Jan 12', value: 5280 },
  { date: 'Jan 19', value: 5480 },
]

export const transactions: Transaction[] = [
  {
    id: 'tx1',
    type: 'buy',
    ticker: 'APDHILLON',
    name: 'AP Dhillon',
    shares: 200,
    price: 2.10,
    total: 420.00,
    date: '2026-05-22T09:15:00Z',
    status: 'completed',
  },
  {
    id: 'tx2',
    type: 'buy',
    ticker: 'LILNASX',
    name: 'Lil Nas X',
    shares: 150,
    price: 3.20,
    total: 480.00,
    date: '2026-05-14T11:20:00Z',
    status: 'completed',
  },
]
