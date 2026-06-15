'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn, formatPrice, formatPercent } from '@/lib/utils'
import type { Creator } from '@/types'

const ease = [0.16, 1, 0.3, 1] as const

// ── Swipe card ────────────────────────────────────────────────────────────────

function SwipeCard({
  creator,
  onLeft,
  onRight,
}: {
  creator: Creator
  onLeft: () => void
  onRight: () => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-280, 280], [-14, 14])
  const backOpacity = useTransform(x, [20, 90], [0, 1])
  const skipOpacity = useTransform(x, [-90, -20], [1, 0])
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const isUp = creator.priceChangePercent24h >= 0

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 80) setExiting('right')
    else if (info.offset.x < -80) setExiting('left')
  }

  return (
    <motion.div
      style={{ x, rotate, zIndex: 10, position: 'absolute', inset: 0 }}
      drag={exiting ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      onDragEnd={handleDragEnd}
      animate={
        exiting ? { x: exiting === 'right' ? 600 : -600, opacity: 0 } : undefined
      }
      transition={exiting ? { duration: 0.3, ease } : undefined}
      onAnimationComplete={() => {
        if (exiting === 'right') onRight()
        else if (exiting === 'left') onLeft()
      }}
      className="rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Background image */}
      {creator.imageUrl ? (
        <img
          src={creator.imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />

      {/* BACK stamp — brightens as you drag right */}
      <motion.div
        style={{ opacity: backOpacity, rotate: -14, transformOrigin: 'center' }}
        className="absolute top-8 left-5 px-3 py-1.5 border-[2.5px] border-hype-gold text-hype-gold font-black text-lg tracking-[0.18em] rounded-xl pointer-events-none"
      >
        BACK
      </motion.div>

      {/* SKIP stamp — brightens as you drag left */}
      <motion.div
        style={{ opacity: skipOpacity, rotate: 14, transformOrigin: 'center' }}
        className="absolute top-8 right-5 px-3 py-1.5 border-[2.5px] border-white/30 text-white/50 font-black text-lg tracking-[0.18em] rounded-xl pointer-events-none"
      >
        SKIP
      </motion.div>

      {/* Card content */}
      <div className="absolute bottom-0 left-0 right-0 p-7 pointer-events-none">
        <p className="text-white/40 text-[9px] tracking-[0.22em] uppercase mb-2">
          {creator.category} · {creator.followers} fans
        </p>
        <h2
          className="text-white font-black tracking-tight leading-none mb-2"
          style={{ fontSize: 'clamp(1.75rem, 8vw, 2.4rem)' }}
        >
          {creator.name}
        </h2>
        {creator.story && (
          <p className="text-white/50 text-[13px] leading-relaxed mb-4 max-w-[260px]">
            {creator.story}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl tabular">
            {formatPrice(creator.price)}
          </span>
          <span
            className={cn(
              'text-sm font-bold tabular',
              isUp ? 'text-hype-green' : 'text-hype-red',
            )}
          >
            {isUp ? '+' : ''}
            {formatPercent(creator.priceChangePercent24h)} today
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Overlay ───────────────────────────────────────────────────────────────────

export function DiscoverStack({
  creators,
  onBuy,
  onClose,
}: {
  creators: Creator[]
  onBuy: (c: Creator) => void
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)

  const current = creators[index]
  const next1 = creators[index + 1]
  const next2 = creators[index + 2]
  const remaining = creators.length - index
  const isDone = !current

  function handleLeft() {
    setIndex(i => i + 1)
  }

  function handleRight() {
    if (current) onBuy(current)
    setIndex(i => i + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[45] bg-black/93 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pb-4 flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 72px)' }}
      >
        <div>
          <p className="section-label text-hype-gold">Discover Mode</p>
          <p className="text-hype-muted text-xs mt-0.5">
            {Math.max(0, remaining)} creators remaining
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative mx-5 mb-4 min-h-0">
        {isDone ? (
          <div className="h-full flex flex-col items-center justify-center text-center rounded-3xl border border-hype-border">
            <p className="text-hype-text font-black text-2xl tracking-tight mb-2">
              All caught up.
            </p>
            <p className="text-hype-muted text-sm mb-6 max-w-[200px]">
              You&apos;ve seen every creator on the market.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm"
            >
              Back to Discover
            </button>
          </div>
        ) : (
          <>
            {/* Depth card — furthest back */}
            {next2 && (
              <div
                className={cn(
                  'absolute rounded-3xl overflow-hidden',
                  next2.imageUrl ? '' : cn('bg-gradient-to-br', next2.coverColor),
                )}
                style={{
                  left: 28, right: 28, top: 20, bottom: 0,
                  zIndex: 0, opacity: 0.35, pointerEvents: 'none',
                }}
              >
                {next2.imageUrl && (
                  <img src={next2.imageUrl} alt="" className="w-full h-full object-cover object-top" />
                )}
                <div className="absolute inset-0 bg-black/65" />
              </div>
            )}

            {/* Depth card — one behind */}
            {next1 && (
              <div
                className={cn(
                  'absolute rounded-3xl overflow-hidden',
                  next1.imageUrl ? '' : cn('bg-gradient-to-br', next1.coverColor),
                )}
                style={{
                  left: 14, right: 14, top: 10, bottom: 0,
                  zIndex: 1, opacity: 0.55, pointerEvents: 'none',
                }}
              >
                {next1.imageUrl && (
                  <img src={next1.imageUrl} alt="" className="w-full h-full object-cover object-top" />
                )}
                <div className="absolute inset-0 bg-black/50" />
              </div>
            )}

            {/* Active swipe card */}
            <AnimatePresence mode="wait">
              {current && (
                <SwipeCard
                  key={current.id}
                  creator={current}
                  onLeft={handleLeft}
                  onRight={handleRight}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Action row */}
      {!isDone && (
        <div className="px-5 pb-8 flex-shrink-0 flex items-center justify-between">
          <button
            onClick={handleLeft}
            className="w-14 h-14 rounded-full border border-hype-border bg-hype-surface flex items-center justify-center text-hype-muted hover:text-hype-secondary hover:border-hype-border-light transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="text-hype-dim text-[10px] uppercase tracking-widest">
            Swipe or tap
          </p>
          <button
            onClick={handleRight}
            className="w-14 h-14 rounded-full bg-hype-gold flex items-center justify-center text-[#0A0A0A] hover:bg-hype-gold-dim transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
