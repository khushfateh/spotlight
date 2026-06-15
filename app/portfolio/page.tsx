'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import { creators } from '@/lib/mock-data'
import { holdings, transactions } from '@/lib/mock-data'
import { formatTimeAgo, cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data'
import { fadeUp, sectionReveal, ease, countDuration, countEase } from '@/lib/motion'
import type { Holding } from '@/types'

// ── Holding narrative map ─────────────────────────────────────────────────────

const narratives: Record<string, string> = {
  APDHILLON: 'spotted before his North American tour sold out.',
  MRBEAST: 'spotted before the Netflix partnership was announced.',
  SPEED: 'spotted before the Ronaldo collab made him global.',
  LILNASX: 'spotted early ahead of the album that sent streams up 340%.',
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedValue({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started || !ref.current) return
    const el = ref.current
    const start = performance.now()
    let rafId: number

    function tick(now: number) {
      const t = Math.min((now - start) / countDuration, 1)
      el.textContent = Math.round(to * countEase(t)).toString()
      if (t < 1) { rafId = requestAnimationFrame(tick) }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [started, to])

  return <span ref={ref} className={className}>0</span>
}

// ── Narrative holding card ────────────────────────────────────────────────────

function PortfolioHoldingCard({
  holding,
  onSell,
  delay,
}: {
  holding: Holding
  onSell?: () => void
  delay?: number
}) {
  const narrative = narratives[holding.ticker]
  const creatorData = creators.find(c => c.ticker === holding.ticker)
  const { score: currentScore, delta: weeklyDelta } = getMomentum(holding.ticker)
  const tier = getMomentumTier(currentScore)
  const momentumGain = currentScore - holding.momentumAtSpot
  const isGain = momentumGain >= 0
  const isWeeklyUp = weeklyDelta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: delay ?? 0 }}
      className="premium-card rounded-3xl overflow-hidden"
    >
      <Link href={`/creator/${holding.ticker.toLowerCase()}`}>
        {/* Image strip — editorial, not an avatar */}
        {creatorData?.imageUrl ? (
          <div className="relative h-20 overflow-hidden">
            <img
              src={creatorData.imageUrl}
              alt=""
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-hype-surface via-hype-surface/60 to-transparent" />
            <div className="absolute inset-y-0 left-0 px-4 flex flex-col justify-center">
              <p className="text-hype-text font-black text-lg tracking-tight leading-tight">
                {holding.name}
              </p>
              <p className="text-white/50 text-[10px] font-mono tracking-widest mt-0.5">
                ${holding.ticker}
              </p>
            </div>
          </div>
        ) : (
          <div className={cn('h-16 bg-gradient-to-br relative', holding.coverColor)}>
            <div className="absolute inset-0 bg-gradient-to-r from-hype-surface to-transparent" />
            <div className="absolute inset-0 px-4 flex items-center">
              <p className="text-hype-text font-black text-lg tracking-tight">{holding.name}</p>
            </div>
          </div>
        )}
      </Link>

      <div className="px-4 pt-3 pb-4">
        {/* Narrative */}
        {narrative && (
          <p className="text-hype-secondary text-sm leading-relaxed mb-3">
            <span className="text-hype-text font-medium">You </span>
            {narrative}
          </p>
        )}

        {/* Momentum growth */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-hype-text font-black text-2xl tabular tracking-tight leading-none">
              {currentScore}
            </p>
            <p className="text-hype-gold text-[10px] font-bold uppercase tracking-wider mt-0.5">
              {tier}
            </p>
          </div>
          <div className="text-right">
            <p className={cn('font-black text-xl tabular tracking-tight', isGain ? 'text-hype-green' : 'text-hype-red')}>
              {isGain ? '+' : ''}{momentumGain} pts
            </p>
            <p className="text-hype-muted text-[10px] mt-0.5">
              spotted at {holding.momentumAtSpot}
            </p>
          </div>
        </div>

        {/* Weekly delta */}
        <div className="flex items-center justify-between text-xs text-hype-dim mb-3">
          <span>this week <span className={cn('font-semibold tabular', isWeeklyUp ? 'text-hype-green' : 'text-hype-red')}>{isWeeklyUp ? '+' : ''}{weeklyDelta} pts</span></span>
          <span className="text-hype-muted">momentum score</span>
        </div>

        {onSell && (
          <button
            onClick={onSell}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-hype-muted bg-transparent border border-hype-border hover:border-hype-border-light hover:text-hype-secondary transition-colors"
          >
            Release
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'Spotted' | 'Activity'

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Spotted')
  const trade = useTradeSheet()

  const avgMomentum = Math.round(
    holdings.reduce((sum, h) => sum + getMomentum(h.ticker).score, 0) / holdings.length,
  )

  return (
    <>
      <div className="px-4 pb-32">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <motion.p {...fadeUp(0)} className="section-label mb-4">
            Your Discoveries
          </motion.p>
          <motion.div {...fadeUp(0.08)} className="flex items-end gap-3">
            <AnimatedValue
              to={holdings.length}
              className="number-display text-hype-text"
            />
            <span className="text-hype-muted text-base pb-2 font-medium">creators spotted</span>
          </motion.div>
          <motion.div {...fadeUp(0.14)} className="flex items-center gap-2 mt-2">
            <span className="text-hype-gold text-sm font-bold tabular">
              {avgMomentum}
            </span>
            <span className="text-hype-muted text-xs">avg momentum · {getMomentumTier(avgMomentum)}</span>
          </motion.div>
        </div>

        {/* Discovery tagline */}
        <motion.p {...fadeUp(0.18)} className="text-hype-muted text-sm mb-6">
          You&apos;ve spotted{' '}
          <span className="text-hype-text font-semibold">{holdings.length} creators</span>
          {' '}— and got ahead of the curve on each one.
        </motion.p>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.22)}
          className="flex gap-4 border-b border-hype-border/60 mb-6"
        >
          {(['Spotted', 'Activity'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors relative',
                activeTab === tab
                  ? 'text-hype-text'
                  : 'text-hype-muted hover:text-hype-secondary',
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="portfolio-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-hype-gold"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Spotted ───────────────────────────────────────────────────── */}
        {activeTab === 'Spotted' && (
          <div className="space-y-4">
            {holdings.map((holding, i) => {
              const creatorData = creators.find(c => c.ticker === holding.ticker)
              return (
                <PortfolioHoldingCard
                  key={holding.ticker}
                  holding={holding}
                  onSell={creatorData ? () => trade.openSell(creatorData) : undefined}
                  delay={i * 0.08}
                />
              )
            })}

            {/* Discover CTA */}
            <motion.div
              {...sectionReveal}
              className="rounded-3xl border border-hype-border border-dashed p-6 text-center"
            >
              <p className="text-hype-secondary text-sm mb-3">Find your next discovery</p>
              <Link href="/explore">
                <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm hover:bg-hype-gold-dim transition-colors">
                  Explore Creators <ArrowRight size={14} />
                </button>
              </Link>
            </motion.div>
          </div>
        )}

        {/* ── Activity ──────────────────────────────────────────────────── */}
        {activeTab === 'Activity' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {transactions.length === 0 ? (
              <div className="py-16 text-center">
                <Clock size={28} className="text-hype-dim mx-auto mb-3" />
                <p className="text-hype-text font-semibold mb-1">No activity yet</p>
                <p className="text-hype-secondary text-sm">Your spotting history will appear here</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease, delay: i * 0.05 }}
                  className="premium-card rounded-2xl flex items-center gap-3 px-4 py-3.5"
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      tx.type === 'buy' ? 'bg-hype-green' : 'bg-hype-muted',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-hype-text text-sm font-semibold">
                      {tx.type === 'buy' ? 'Spotted' : 'Released'}{' '}
                      <span className="font-mono text-hype-secondary">${tx.ticker}</span>
                    </p>
                    <p className="text-hype-muted text-xs mt-0.5">
                      {formatTimeAgo(tx.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-xs font-semibold uppercase tracking-wide',
                      tx.type === 'buy' ? 'text-hype-green' : 'text-hype-muted',
                    )}>
                      {tx.type === 'buy' ? '+ Spotted' : '− Released'}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        <div className="text-center mt-10">
          <p className="text-hype-dim text-[10px]">
            Mock discoveries · Not financial advice
          </p>
        </div>
      </div>

      <TradeSheet
        isOpen={trade.isOpen}
        creator={trade.creator}
        tradeType={trade.tradeType}
        step={trade.step as 'form' | 'confirm' | 'success' | 'error'}
        pendingOrder={trade.pendingOrder}
        isSubmitting={trade.isSubmitting}
        onClose={trade.close}
        onSubmitOrder={trade.submitOrder}
        onConfirmOrder={trade.confirmOrder}
        onReset={trade.reset}
      />
    </>
  )
}
