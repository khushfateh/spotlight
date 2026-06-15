'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useEffect, type ReactNode } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from 'framer-motion'
import { ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import PriceChart from '@/components/market/PriceChart'
import IPOCard from '@/components/ipo/IPOCard'
import PostCard from '@/components/community/PostCard'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import {
  getTrendingCreators,
  ipoCreators,
  communityPosts,
  totalPortfolioValue,
  totalPnlPercent,
} from '@/lib/mock-data'
import { formatPrice, formatPercent, formatLargeNumber, cn } from '@/lib/utils'
import type { Creator } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const

const sectionReveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1 as number, y: 0 as number },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.65, ease },
}

// ── Animated counter ──────────────────────────────────────────────────────────

function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const el = ref.current
    const duration = 1400
    const startTime = performance.now()
    let rafId: number

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = formatLargeNumber(to * eased)
      if (t < 1) { rafId = requestAnimationFrame(tick) }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, to])

  return <span ref={ref} className={className}>$0</span>
}

// ── Tilt card — cursor-reactive on desktop ────────────────────────────────────

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5])

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX, rotateY, transformPerspective: 600 }}
      onMouseMove={e => {
        const rect = cardRef.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Cinematic hero ────────────────────────────────────────────────────────────

function CinematicHero({
  featured,
  onBuy,
  portfolioValue,
  portfolioChange,
}: {
  featured: Creator
  onBuy: (c: Creator) => void
  portfolioValue: number
  portfolioChange: number
}) {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, -70])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const isPortfolioUp = portfolioChange >= 0
  const isFeaturedUp = featured.priceChangePercent24h >= 0

  return (
    <section
      ref={heroRef}
      className="-mt-14 relative overflow-hidden"
      style={{ height: '100svh' }}
    >
      {/* Layer 1: Creator editorial photo — parallax zoom */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        {featured.imageUrl ? (
          <img
            src={featured.imageUrl}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', featured.coverColor)} />
        )}
      </motion.div>

      {/* Layer 2: Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
      {/* Spotlight accent — warm gold from upper center, performer-on-stage feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 35% at 58% 8%, rgba(201,168,76,0.13) 0%, transparent 70%)',
        }}
      />

      {/* Layer 3: Scrolling content — fades + lifts on scroll */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Portfolio pill — top right */}
        <div className="flex justify-end px-5 pt-[72px]">
          <Link href="/portfolio">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  isPortfolioUp ? 'bg-hype-green' : 'bg-hype-red',
                )}
              />
              <span className="text-white text-[11px] font-semibold tabular">
                {formatLargeNumber(portfolioValue)}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium tabular',
                  isPortfolioUp ? 'text-hype-green' : 'text-hype-red',
                )}
              >
                {isPortfolioUp ? '+' : ''}
                {formatPercent(portfolioChange)}
              </span>
            </div>
          </Link>
        </div>

        {/* Spacer pushes editorial content to bottom */}
        <div className="flex-1" />

        {/* Editorial content — bottom of hero */}
        <div className="px-5 pb-28">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-1 rounded-full bg-hype-gold" />
            <p className="section-label text-hype-gold">
              Featured this week · {featured.category}
            </p>
          </div>

          <h1 className="display-headline text-white mb-5">
            INVEST IN<br />WHO&apos;S NEXT.
          </h1>

          {featured.story && (
            <p className="text-white/60 text-[15px] leading-[1.65] mb-7 max-w-[280px]">
              {featured.story}
            </p>
          )}

          <button
            onClick={() => onBuy(featured)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all active:scale-[0.98] shadow-[0_4px_24px_rgba(201,168,76,0.25)]"
          >
            Back {featured.name.split(' ')[0]}
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Layer 4: Creator identity bar — anchored to bottom of section */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-5 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/35 text-[9px] tracking-widest uppercase font-medium mb-1">
              {featured.category}
            </p>
            <p className="text-white font-black text-[22px] tracking-tight leading-none">
              {featured.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-[22px] tabular tracking-tight leading-none">
              {formatPrice(featured.price)}
            </p>
            <p
              className={cn(
                'text-xs font-semibold tabular mt-1',
                isFeaturedUp ? 'text-hype-green' : 'text-hype-red',
              )}
            >
              {isFeaturedUp ? '+' : ''}
              {formatPercent(featured.priceChangePercent24h)} today
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Creator portrait card — Netflix style with tilt ───────────────────────────

function CreatorPortraitCard({
  creator,
  onBuy,
  delay = 0,
}: {
  creator: Creator
  onBuy: (c: Creator) => void
  delay?: number
}) {
  const isUp = creator.priceChangePercent24h >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className="flex-shrink-0"
      style={{ width: 176 }}
    >
      <TiltCard>
        <div className="relative group cursor-pointer">
          <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
            <div className="relative rounded-3xl overflow-hidden" style={{ height: 264 }}>
              {/* Background: editorial photo or gradient fallback */}
              {creator.imageUrl ? (
                <img
                  src={creator.imageUrl}
                  alt={creator.name}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br',
                    creator.coverColor,
                  )}
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/5" />

              {/* Stats — revealed on hover */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                <p className="text-white/70 text-[9px] leading-loose">{creator.followers} fans</p>
                <p className="text-white/50 text-[9px]">Score {creator.creatorScore}/100</p>
              </div>

              {/* Back button — revealed on hover */}
              <button
                onClick={e => {
                  e.preventDefault()
                  onBuy(creator)
                }}
                className="absolute top-3 right-3 px-2.5 py-1 bg-hype-gold text-[#0A0A0A] text-[9px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 hover:bg-hype-gold-dim"
              >
                Back
              </button>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-8 -mx-1 mb-2 opacity-55">
                  <PriceChart
                    data={creator.priceHistory}
                    isPositive={isUp}
                    height={32}
                    compact
                  />
                </div>
                <p className="text-white font-bold text-[14px] leading-tight tracking-tight">
                  {creator.name}
                </p>
                <p className="text-white/35 text-[9px] font-mono tracking-wider mt-0.5 mb-1.5">
                  ${creator.ticker}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm tabular">
                    {formatPrice(creator.price)}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] font-semibold tabular',
                      isUp ? 'text-hype-green' : 'text-hype-red',
                    )}
                  >
                    {isUp ? '+' : ''}
                    {formatPercent(creator.priceChangePercent24h)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </TiltCard>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const trade = useTradeSheet()
  const trending = getTrendingCreators(6)
  const featured = trending[0]
  const openIPOs = ipoCreators.filter(i => i.status === 'open').slice(0, 2)
  const posts = communityPosts.slice(0, 3)

  if (!featured) return null

  return (
    <>
      {/* ── Cinematic hero ──────────────────────────────────────────────── */}
      <CinematicHero
        featured={featured}
        onBuy={trade.openBuy}
        portfolioValue={totalPortfolioValue}
        portfolioChange={totalPnlPercent}
      />

      {/* ── Live ticker strip ───────────────────────────────────────────── */}
      <motion.div
        {...sectionReveal}
        className="px-5 py-5 border-b border-hype-border/50"
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1.5 h-1.5 rounded-full bg-hype-green"
            style={{ boxShadow: '0 0 6px #10B981' }}
          />
          <span className="section-label">Live Markets</span>
        </div>
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          {trending.slice(0, 5).map((c, i) => {
            const up = c.priceChangePercent24h >= 0
            return (
              <Link
                key={c.id}
                href={`/creator/${c.ticker.toLowerCase()}`}
                className="flex-shrink-0 group"
              >
                <p className="text-hype-dim text-[9px] font-mono tracking-wider mb-0.5">
                  ${c.ticker}
                </p>
                <p
                  className="text-hype-text text-sm font-bold tabular group-hover:text-white transition-colors live-price"
                  style={{ animationDelay: `${i * 0.55}s` }}
                >
                  {formatPrice(c.price)}
                </p>
                <p
                  className={cn(
                    'text-[10px] font-semibold tabular',
                    up ? 'text-hype-green' : 'text-hype-red',
                  )}
                >
                  {up ? '+' : ''}
                  {formatPercent(c.priceChangePercent24h)}
                </p>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* ── Featured story card ─────────────────────────────────────────── */}
      <motion.section
        {...sectionReveal}
        className="px-5 py-8 border-b border-hype-border/50"
      >
        <p className="section-label text-hype-gold mb-4">This Week in Culture</p>

        {/* Creator identity row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-hype-text font-black text-2xl tracking-tight leading-tight mb-2">
              {featured.name}
            </h2>
            <p className="text-hype-secondary text-sm leading-relaxed">
              {featured.bio.split('.')[0]}.
            </p>
          </div>
          {featured.imageUrl && (
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-hype-border">
              <img
                src={featured.imageUrl}
                alt={featured.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}
        </div>

        {/* Animated stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">
              Market Cap
            </p>
            <CountUp
              to={featured.marketCap}
              className="text-hype-text font-black text-lg metric-display"
            />
          </div>
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Score</p>
            <p className="text-hype-text font-black text-lg metric-display">
              {featured.creatorScore}
              <span className="text-hype-dim text-xs font-normal">/100</span>
            </p>
          </div>
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Fans</p>
            <p className="text-hype-text font-black text-lg metric-display">{featured.followers}</p>
          </div>
        </div>

        {/* Price chart */}
        <div className="h-16 -mx-1 mb-5">
          <PriceChart
            data={featured.priceHistory}
            isPositive={featured.priceChangePercent24h >= 0}
            height={64}
            compact
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => trade.openBuy(featured)}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(201,168,76,0.18)]"
        >
          Back {featured.name.split(' ')[0]} · {formatPrice(featured.price)}
          <ArrowRight size={14} />
        </button>
      </motion.section>

      {/* ── Culture Picks (Netflix horizontal) ─────────────────────────── */}
      <motion.section {...sectionReveal} className="py-8">
        <div className="px-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-hype-text font-black text-xl leading-none tracking-tight">
              Culture Picks
            </p>
            <p className="text-hype-muted text-xs mt-1">Momentum · 24h</p>
          </div>
          <Link href="/explore">
            <span className="text-hype-muted text-xs flex items-center gap-0.5 hover:text-hype-secondary transition-colors">
              See all <ChevronRight size={12} />
            </span>
          </Link>
        </div>

        <div className="flex gap-4 pl-5 overflow-x-auto hide-scrollbar pb-2" style={{ paddingRight: 20 }}>
          {trending.map((c, i) => (
            <CreatorPortraitCard
              key={c.id}
              creator={c}
              onBuy={trade.openBuy}
              delay={i * 0.06}
            />
          ))}
        </div>
      </motion.section>

      {/* ── Breaking Through (IPOs) ─────────────────────────────────────── */}
      {openIPOs.length > 0 && (
        <motion.section
          {...sectionReveal}
          className="px-5 py-8 border-t border-hype-border/50"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-hype-text font-black text-xl leading-none tracking-tight">
                Breaking Through
              </p>
              <p className="text-hype-muted text-xs mt-1">Back them before they open</p>
            </div>
            <Link href="/ipos">
              <span className="text-hype-muted text-xs flex items-center gap-0.5 hover:text-hype-secondary transition-colors">
                All IPOs <ChevronRight size={12} />
              </span>
            </Link>
          </div>
          <div className="space-y-4">
            {openIPOs.map(ipo => (
              <IPOCard key={ipo.id} ipo={ipo} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── The Conversation ────────────────────────────────────────────── */}
      <motion.section
        {...sectionReveal}
        className="px-5 py-8 border-t border-hype-border/50 pb-32"
      >
        <div className="mb-6">
          <p className="text-hype-text font-black text-xl leading-none tracking-tight">
            The Conversation
          </p>
          <p className="text-hype-muted text-xs mt-1">What the market is saying</p>
        </div>
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-hype-dim text-[10px] leading-relaxed max-w-[280px] mx-auto">
            SPOTLIGHT is a demonstration platform. Cultural Shares represent revenue pool
            participation, not equity ownership. Not investment advice.
          </p>
        </div>
      </motion.section>

      {/* Trade sheet */}
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
