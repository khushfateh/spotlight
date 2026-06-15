'use client'

import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { IPOCreator } from '@/types'
import { formatLargeNumber, cn } from '@/lib/utils'

type IPOCardProps = {
  ipo: IPOCreator
  compact?: boolean
}

export default function IPOCard({ ipo, compact = false }: IPOCardProps) {
  const progress = (ipo.fundingProgress / ipo.fundraisingGoal) * 100
  const isOpen = ipo.status === 'open'
  const isComingSoon = ipo.status === 'coming_soon'

  if (compact) {
    return (
      <div className="premium-card rounded-2xl p-4 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <Avatar initials={ipo.avatar} gradientClass={ipo.coverColor} size="sm" />
          <div>
            <p className="text-hype-text text-sm font-semibold truncate">{ipo.name}</p>
            <div className="flex items-center gap-1">
              <span className="text-hype-dim text-[10px] font-mono">${ipo.ticker}</span>
              <Badge variant={isOpen ? 'green' : 'muted'} size="sm">
                {isComingSoon ? 'Soon' : isOpen ? 'Open' : 'Waitlist'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-hype-muted">Goal</span>
            <span className="text-hype-text font-semibold tabular">{formatLargeNumber(ipo.fundraisingGoal)}</span>
          </div>
          <div className="h-1 bg-hype-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-hype-green rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-hype-green text-xs font-semibold">{Math.round(progress)}% funded</p>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/ipos/${ipo.id}`}>
      <div className="premium-card rounded-2xl overflow-hidden group">
        {/* Cover */}
        <div className={cn('h-28 bg-gradient-to-br relative overflow-hidden', ipo.coverColor)}>
          {ipo.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ipo.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-hype-surface/90 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-end gap-3">
            <Avatar initials={ipo.avatar} gradientClass={ipo.coverColor} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-hype-text font-bold text-base">{ipo.name}</h3>
                <Badge variant={isOpen ? 'green' : isComingSoon ? 'gold' : 'blue'}>
                  {isComingSoon ? 'Coming Soon' : isOpen ? 'Open' : 'Waitlist'}
                </Badge>
              </div>
              <p className="text-hype-secondary text-xs font-mono">${ipo.ticker} · {ipo.category}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-hype-secondary text-sm leading-relaxed mb-4 line-clamp-2">
            &quot;{ipo.pitch}&quot;
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Goal', value: formatLargeNumber(ipo.fundraisingGoal) },
              { label: 'IPO Price', value: `$${ipo.initialPrice.toFixed(2)}` },
              { label: 'Followers', value: ipo.followers },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-hype-text font-bold text-sm tabular">{value}</p>
                <p className="text-hype-dim text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          {!isComingSoon && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-hype-muted">{formatLargeNumber(ipo.fundingProgress)} raised</span>
                <span className="text-hype-green font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-hype-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-hype-green rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center gap-2">
            {isComingSoon ? (
              <Button variant="secondary" size="md" fullWidth>
                <Clock size={14} />
                Notify Me · {ipo.daysUntilLaunch}d
              </Button>
            ) : isOpen ? (
              <Button variant="buy" size="md" fullWidth>
                Invest Now
              </Button>
            ) : (
              <Button variant="outline" size="md" fullWidth>
                <Users size={14} />
                Join Waitlist
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
