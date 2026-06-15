'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Holding } from '@/types'
import { formatPrice, formatPercent, cn } from '@/lib/utils'

type HoldingCardProps = {
  holding: Holding
  onSell?: () => void
}

export default function HoldingCard({ holding, onSell }: HoldingCardProps) {
  const isUp = holding.pnlPercent >= 0

  return (
    <div className="premium-card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Link href={`/creator/${holding.ticker.toLowerCase()}`}>
          <Avatar initials={holding.avatar} gradientClass={holding.coverColor} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <Link href={`/creator/${holding.ticker.toLowerCase()}`}>
              <p className="text-hype-text font-semibold text-sm">{holding.name}</p>
            </Link>
            <p className="text-hype-text font-bold tabular">{formatPrice(holding.totalValue)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-hype-muted text-xs">{holding.shares.toLocaleString()} shares · avg {formatPrice(holding.avgBuyPrice)}</p>
            <div className={cn('flex items-center gap-0.5 text-xs font-semibold', isUp ? 'text-hype-green' : 'text-hype-red')}>
              {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {formatPercent(holding.pnlPercent)}
            </div>
          </div>
        </div>
      </div>

      {/* P&L row */}
      <div className="mt-3 pt-3 border-t border-hype-border flex items-center justify-between text-xs">
        <div>
          <span className="text-hype-muted">Cost basis: </span>
          <span className="text-hype-secondary font-medium tabular">{formatPrice(holding.totalCost)}</span>
        </div>
        <div className={cn('font-semibold tabular', isUp ? 'text-hype-green' : 'text-hype-red')}>
          {isUp ? '+' : ''}{formatPrice(holding.pnl)}
        </div>
      </div>

      {onSell && (
        <button
          onClick={onSell}
          className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-hype-red bg-transparent border border-hype-red/20 hover:bg-hype-red/8 transition-colors"
        >
          Sell Shares
        </button>
      )}
    </div>
  )
}
