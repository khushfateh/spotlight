'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { getCreatorByTicker } from '@/lib/mock-data/creators'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { formatTimeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { SpotRelationship, CardStatus } from '@/lib/services/spotterService'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function SpotterBadge({ number, variant }: { number: number; variant: CardStatus }) {
  if (variant === 'active') {
    return (
      <span
        className="text-[10px] font-bold tabular"
        style={{ color: 'rgba(201,168,76,0.9)' }}
      >
        Spotter #{number}
      </span>
    )
  }
  if (variant === 'rediscovered') {
    return (
      <span
        className="text-[10px] font-bold tabular"
        style={{ color: 'rgba(200,210,225,0.85)' }}
      >
        Spotter #{number} ✦
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold tabular text-hype-dim">
      Spotter #{number}
    </span>
  )
}

// ── Active card (Gold) ────────────────────────────────────────────────────────

function ActiveSpotCard({ rel, delay }: { rel: SpotRelationship; delay?: number }) {
  const creator = getCreatorByTicker(rel.ticker)
  const { score, delta } = getMomentum(rel.ticker)
  const tier = getMomentumTier(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
    >
      <Link
        href={`/creator/${rel.ticker.toLowerCase()}`}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
        style={{
          background: 'rgba(201,168,76,0.04)',
          borderColor: 'rgba(201,168,76,0.18)',
        }}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-gradient-to-br',
            creator?.coverColor ?? 'from-hype-purple to-hype-indigo',
          )}
        >
          {creator?.avatar ?? rel.name[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-hype-text text-sm font-semibold truncate">
            {rel.name || creator?.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <SpotterBadge number={rel.spotterNumber} variant="active" />
            <span className="text-hype-dim text-[9px]">·</span>
            <span className="text-hype-dim text-[10px]">
              {formatTimeAgo(rel.firstSpottedAt.toISOString())}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-hype-text font-bold text-sm">{score}</p>
          <p className="text-hype-gold text-[10px] font-semibold">{tier}</p>
          <p
            className={cn(
              'text-[10px] font-semibold',
              delta >= 0 ? 'text-hype-green' : 'text-hype-red',
            )}
          >
            {delta >= 0 ? '+' : ''}{delta}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Moved On card (Muted Silver) ──────────────────────────────────────────────

function MovedOnCard({ rel, delay }: { rel: SpotRelationship; delay?: number }) {
  const creator = getCreatorByTicker(rel.ticker)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
    >
      <Link
        href={`/creator/${rel.ticker.toLowerCase()}`}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
        style={{
          background: 'rgba(150,160,180,0.03)',
          borderColor: 'rgba(150,160,180,0.12)',
        }}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-white/50 text-xs font-black flex-shrink-0 bg-gradient-to-br opacity-40',
            creator?.coverColor ?? 'from-hype-purple to-hype-indigo',
          )}
        >
          {creator?.avatar ?? rel.name[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-hype-muted text-sm font-semibold truncate">
            {rel.name || creator?.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <SpotterBadge number={rel.spotterNumber} variant="moved_on" />
            <span className="text-hype-dim text-[9px]">·</span>
            <span className="text-hype-dim text-[10px]">
              Spotted {formatDate(rel.firstSpottedAt)}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {rel.latestMovedOnAt && (
            <>
              <p className="text-hype-dim text-[10px]">Moved On</p>
              <p className="text-hype-muted text-[10px] font-semibold">
                {formatDate(rel.latestMovedOnAt)}
              </p>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// ── Rediscovered card (Premium Silver ✦) ──────────────────────────────────────

function RediscoveredCard({ rel, delay }: { rel: SpotRelationship; delay?: number }) {
  const creator = getCreatorByTicker(rel.ticker)
  const { score } = getMomentum(rel.ticker)
  const tier = getMomentumTier(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
    >
      <Link
        href={`/creator/${rel.ticker.toLowerCase()}`}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(200,210,225,0.05) 0%, rgba(201,168,76,0.04) 100%)',
          borderColor: 'rgba(200,210,225,0.2)',
        }}
      >
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black bg-gradient-to-br',
              creator?.coverColor ?? 'from-hype-purple to-hype-indigo',
            )}
          >
            {creator?.avatar ?? rel.name[0] ?? '?'}
          </div>
          <span
            className="absolute -top-1 -right-1 text-[8px] leading-none"
            style={{ color: 'rgba(201,168,76,0.9)' }}
          >
            ✦
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-hype-text text-sm font-semibold truncate">
            {rel.name || creator?.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <SpotterBadge number={rel.spotterNumber} variant="rediscovered" />
            <span className="text-hype-dim text-[9px]">·</span>
            <span className="text-hype-dim text-[10px]">
              {rel.rediscoveredAt ? formatTimeAgo(rel.rediscoveredAt.toISOString()) : 'Rediscovered'}
            </span>
          </div>
          <p className="text-hype-dim text-[9px] mt-0.5">
            First spotted {formatDate(rel.firstSpottedAt)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-hype-text font-bold text-sm">{score}</p>
          <p
            className="text-[10px] font-semibold"
            style={{ color: 'rgba(200,210,225,0.7)' }}
          >
            {tier}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

// ── Unified export ────────────────────────────────────────────────────────────

export function SpotterCard({
  rel,
  variant,
  delay,
}: {
  rel: SpotRelationship
  variant: CardStatus
  delay?: number
}) {
  if (variant === 'moved_on') return <MovedOnCard rel={rel} delay={delay} />
  if (variant === 'rediscovered') return <RediscoveredCard rel={rel} delay={delay} />
  return <ActiveSpotCard rel={rel} delay={delay} />
}
