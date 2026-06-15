'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import PriceChart from './PriceChart'
import type { Creator } from '@/types'
import { formatPrice, formatPercent, cn } from '@/lib/utils'

type CreatorCardProps = {
  creator: Creator
  onBuy?: (creator: Creator) => void
}

const categoryVariant: Record<string, 'muted' | 'purple' | 'blue' | 'green' | 'gold'> = {
  Music: 'purple',
  Gaming: 'blue',
  Sports: 'green',
  Content: 'muted',
  Lifestyle: 'muted',
  Podcast: 'muted',
}

export default function CreatorCard({ creator, onBuy }: CreatorCardProps) {
  const isUp = creator.priceChangePercent24h >= 0

  return (
    <div className="premium-card rounded-2xl p-4 min-w-[168px] max-w-[192px] group cursor-pointer">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
          <Avatar
            initials={creator.avatar}
            gradientClass={creator.coverColor}
            size="md"
            isVerified={creator.isVerified}
          />
        </Link>
        <Badge variant={categoryVariant[creator.category] ?? 'muted'} size="sm">
          {creator.category}
        </Badge>
      </div>

      {/* Creator info */}
      <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
        <div className="mb-3">
          <p className="text-hype-text font-semibold text-sm truncate leading-snug">{creator.name}</p>
          <p className="text-hype-muted text-[10px] font-mono mt-0.5 tracking-wider">${creator.ticker}</p>
        </div>

        {/* Sparkline */}
        <div className="h-12 -mx-1 mb-3">
          <PriceChart data={creator.priceHistory} isPositive={isUp} height={48} compact />
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-hype-text font-bold text-base tabular tracking-tight">{formatPrice(creator.price)}</p>
            <div className={cn('flex items-center gap-0.5 text-[11px] font-medium mt-0.5', isUp ? 'text-hype-green' : 'text-hype-red')}>
              {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {formatPercent(creator.priceChangePercent24h)}
            </div>
          </div>

          {onBuy && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onBuy(creator)
              }}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-hype-gold text-[#0A0A0A] hover:bg-hype-gold-dim transition-colors duration-150 active:scale-95"
            >
              Buy
            </button>
          )}
        </div>
      </Link>
    </div>
  )
}
