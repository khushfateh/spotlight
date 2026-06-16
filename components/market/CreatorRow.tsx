'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import PriceChart from './PriceChart'
import type { Creator } from '@/types'
import { formatPrice, formatPercent, cn } from '@/lib/utils'

type CreatorRowProps = {
  creator: Creator
  rank?: number
  showChart?: boolean
  onBuy?: (creator: Creator) => void
}

export default function CreatorRow({ creator, rank, showChart = true, onBuy }: CreatorRowProps) {
  const isUp = creator.priceChangePercent24h >= 0

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-hype-surface/60 transition-colors group">
      {rank !== undefined && (
        <span className="text-hype-dim text-xs font-mono w-5 text-center flex-shrink-0">{rank}</span>
      )}

      <Link href={`/creator/${creator.ticker.toLowerCase()}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar
          initials={creator.avatar}
          gradientClass={creator.coverColor}
          imageUrl={creator.imageUrl}
          size="sm"
          isVerified={creator.isVerified}
        />
        <div className="flex-1 min-w-0">
          <p className="text-hype-text text-sm font-medium truncate">{creator.name}</p>
          <p className="text-hype-dim text-[10px] font-mono tracking-wider">${creator.ticker}</p>
        </div>
      </Link>

      {showChart && (
        <div className="w-14 h-7 flex-shrink-0">
          <PriceChart data={creator.priceHistory} isPositive={isUp} height={28} compact />
        </div>
      )}

      <div className="text-right flex-shrink-0 min-w-[76px]">
        <p className="text-hype-text text-sm font-semibold tabular">{formatPrice(creator.price)}</p>
        <div className={cn('flex items-center justify-end gap-0.5 text-[11px] font-medium', isUp ? 'text-hype-green' : 'text-hype-red')}>
          {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {formatPercent(creator.priceChangePercent24h)}
        </div>
      </div>

      {onBuy && (
        <button
          onClick={() => onBuy(creator)}
          className="hidden group-hover:flex text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-hype-gold text-[#0A0A0A] hover:bg-hype-gold-dim transition-all duration-150 active:scale-95 flex-shrink-0 ml-1"
        >
          Buy
        </button>
      )}
    </div>
  )
}
