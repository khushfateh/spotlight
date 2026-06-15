'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, type ReactNode } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { ArrowRight, ChevronRight, Info, Zap } from 'lucide-react'
import Link from 'next/link'
import IPOCard from '@/components/ipo/IPOCard'
import PostCard from '@/components/community/PostCard'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import { useAuth } from '@/context/AuthContext'
import {
  getTrendingCreators,
  ipoCreators,
  communityPosts,
  holdings,
  getMomentum,
  getMomentumTier,
  getCreatorsByTickers,
} from '@/lib/mock-data'
import { getHomeSections, reasonTypeLabel, type HomeSection } from '@/lib/mock-data/recommendations'
import { cn } from '@/lib/utils'
import type { Creator } from '@/types'

const ease = [0.16, 1, 0.3, 1] as const

const sectionReveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1 as number, y: 0 as number },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.65, ease },
}

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

function CinematicHero({
  featured,
  onBuy,
  discoveryCount,
  avgMomentum,
}: {
  featured: Creator
  onBuy: (c: Creator) => void
  discoveryCount: number
  avgMomentum: number
}) {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, -70])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const { score: featuredScore, delta: featuredDelta } = getMomentum(featured.ticker)
  const featuredTier = getMomentumTier(featuredScore)
  const isFeaturedUp = featuredDelta >= 0

  return (
    <section
      ref={heroRef}
      className="-mt-14 relative overflow-hidden"
      style={{ height: '100svh' }}
    >
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        {featured.imageUrl ? (
          <img
            src={featured.imageUrl}
            alt={featured.name}
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br', featured.coverColor)} />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 58% 8%, rgba(201,168,76,0.13) 0%, transparent 70%)' }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="flex justify-end px-5 pt-[72px]">
          <Link href="/portfolio">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-hype-gold" />
              <span className="text-white text-[11px] font-semibold tabular">
                {discoveryCount} spotted
              </span>
              <span className="text-hype-gold text-[10px] font-medium tabular">
                avg {avgMomentum}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="px-5 pb-28">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-1 rounded-full bg-hype-gold" />
            <p className="section-label text-hype-gold">
              Featured this week · {featured.category}
            </p>
          </div>

          <h1
            className="text-white font-black tracking-tight leading-none mb-5"
            style={{ fontSize: 'clamp(2.6rem, 12vw, 5.5rem)' }}
          >
            {featured.name.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>

          {featured.story && (
            <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-[300px]">
              {featured.story}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => onBuy(featured)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
            >
              Spot {featured.name.split(' ')[0]} <ArrowRight size={14} />
            </button>
            <div className="text-right">
              <p className="text-white font-black text-xl tabular tracking-tight leading-none">
                {featuredScore}
              </p>
              <p className={cn('text-xs font-semibold tabular mt-1', isFeaturedUp ? 'text-hype-green' : 'text-hype-red')}>
                {isFeaturedUp ? '+' : ''}{featuredDelta} pts · {featuredTier}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function CreatorPortraitCard({
  creator,
  onBuy,
  delay = 0,
}: {
  creator: Creator
  onBuy: (c: Creator) => void
  delay?: number
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

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
              {creator.imageUrl ? (
                <img
                  src={creator.imageUrl}
                  alt={creator.name}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/5" />

              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                <p className="text-white/70 text-[9px] leading-loose">{creator.followers} fans</p>
                <p className="text-white/50 text-[9px]">Score {creator.creatorScore}/100</p>
              </div>

              <button
                onClick={e => { e.preventDefault(); onBuy(creator) }}
                className="absolute top-3 right-3 px-2.5 py-1 bg-hype-gold text-[#0A0A0A] text-[9px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 hover:bg-hype-gold-dim"
              >
                Spot
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-[14px] leading-tight tracking-tight">{creator.name}</p>
                <p className="text-white/35 text-[9px] font-mono tracking-wider mt-0.5 mb-1.5">${creator.ticker}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-black text-sm tabular">{score}</p>
                  <p className={cn('text-[10px] font-semibold tabular', isUp ? 'text-hype-green' : 'text-hype-red')}>
                    {isUp ? '+' : ''}{delta} pts
                  </p>
                </div>
                <p className="text-hype-gold text-[8px] font-bold uppercase tracking-wider mt-0.5">{tier}</p>
              </div>
            </div>
          </Link>
        </div>
      </TiltCard>
    </motion.div>
  )
}

function FeaturedCreatorCard({ creator, onBuy }: { creator: Creator; onBuy: (c: Creator) => void }) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <div className="relative rounded-3xl overflow-hidden border border-hype-border" style={{ height: 220 }}>
      {creator.imageUrl ? (
        <img src={creator.imageUrl} alt={creator.name} className="absolute inset-0 w-full h-full object-cover object-top" />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hype-gold/20 border border-hype-gold/30 text-hype-gold text-[9px] font-bold uppercase tracking-wider">
          <Zap size={8} /> {tier}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-2xl leading-tight tracking-tight">{creator.name}</p>
          <p className="text-white/40 text-[10px] font-mono tracking-wider mt-0.5">${creator.ticker}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white font-black text-3xl leading-none">{score}</p>
          <p className={cn('text-xs font-semibold mt-0.5', isUp ? 'text-hype-green' : 'text-hype-red')}>
            {isUp ? '+' : ''}{delta} pts
          </p>
        </div>
      </div>

      <button
        onClick={() => onBuy(creator)}
        className="absolute bottom-5 right-5 translate-y-14 group-hover:translate-y-0 transition-transform"
      />
    </div>
  )
}

function PersonalizedSection({
  section,
  onBuy,
}: {
  section: HomeSection
  onBuy: (c: Creator) => void
}) {
  const sectionCreators = getCreatorsByTickers(section.tickers)
  if (sectionCreators.length === 0) return null

  const reasonLabel = section.reasonLabel ?? (section.reasonType ? reasonTypeLabel[section.reasonType] : undefined)

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease }}
      className="py-6 border-b border-hype-border/50"
    >
      <div className="px-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-hype-text font-black text-lg leading-tight tracking-tight">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-hype-muted text-xs mt-0.5">{section.subtitle}</p>
            )}
          </div>
          <Link href="/explore">
            <ChevronRight size={16} className="text-hype-dim mt-0.5 hover:text-hype-muted transition-colors" />
          </Link>
        </div>

        {reasonLabel && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <Info size={10} className="text-hype-gold/60" />
            <span className="text-hype-gold/70 text-[10px] font-medium">{reasonLabel}</span>
          </div>
        )}
      </div>

      {section.layout === 'featured' && sectionCreators[0] && (
        <div className="px-5">
          <FeaturedCreatorCard creator={sectionCreators[0]} onBuy={onBuy} />
        </div>
      )}

      {section.layout === 'horizontal' && (
        <div className="flex gap-4 pl-5 overflow-x-auto hide-scrollbar pb-2" style={{ paddingRight: 20 }}>
          {sectionCreators.map((c, i) => (
            <CreatorPortraitCard key={c.id} creator={c} onBuy={onBuy} delay={i * 0.05} />
          ))}
        </div>
      )}
    </motion.section>
  )
}

export default function HomeFeed() {
  const trade = useTradeSheet()
  const { currentUser } = useAuth()
  const trending = getTrendingCreators(6)
  const featured = trending[0]
  const openIPOs = ipoCreators.filter(i => i.status === 'open').slice(0, 2)
  const posts = communityPosts.slice(0, 3)

  const discoveryCount = holdings.length
  const avgMomentum = holdings.length
    ? Math.round(holdings.reduce((sum, h) => sum + getMomentum(h.ticker).score, 0) / holdings.length)
    : 0

  const { score: featuredScore } = getMomentum(featured?.ticker ?? '')
  const userId = currentUser?.id ?? 'khush'
  const homeSections = getHomeSections(userId)

  if (!featured) return null

  return (
    <>
      <CinematicHero
        featured={featured}
        onBuy={trade.openBuy}
        discoveryCount={discoveryCount}
        avgMomentum={avgMomentum}
      />

      <motion.div {...sectionReveal} className="px-5 py-5 border-b border-hype-border/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-hype-green" style={{ boxShadow: '0 0 6px #10B981' }} />
          <span className="section-label">Live Momentum</span>
        </div>
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          {trending.slice(0, 5).map((c, i) => {
            const { score, delta } = getMomentum(c.ticker)
            const tier = getMomentumTier(score)
            const up = delta >= 0
            return (
              <Link key={c.id} href={`/creator/${c.ticker.toLowerCase()}`} className="flex-shrink-0 group">
                <p className="text-hype-dim text-[9px] font-mono tracking-wider mb-0.5">${c.ticker}</p>
                <p className="text-hype-text text-sm font-black tabular group-hover:text-white transition-colors live-price" style={{ animationDelay: `${i * 0.55}s` }}>
                  {score}
                </p>
                <p className="text-hype-gold text-[8px] font-semibold uppercase tracking-wider">{tier}</p>
                <p className={cn('text-[10px] font-semibold tabular', up ? 'text-hype-green' : 'text-hype-red')}>
                  {up ? '+' : ''}{delta} pts
                </p>
              </Link>
            )
          })}
        </div>
      </motion.div>

      <div className="px-5 pt-8 pb-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-1">
              Your Daily Cultural Briefing
            </p>
            <h2 className="text-white font-black text-2xl tracking-tight">
              {currentUser ? `Good morning, ${currentUser.name.split(' ')[0]}.` : 'What to watch today.'}
            </h2>
          </div>
        </div>
      </div>

      {homeSections.map(section => (
        <PersonalizedSection key={section.id} section={section} onBuy={trade.openBuy} />
      ))}

      <motion.section {...sectionReveal} className="px-5 py-8 border-b border-hype-border/50">
        <p className="section-label text-hype-gold mb-4">This Week in Culture</p>
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
              <img src={featured.imageUrl} alt={featured.name} className="w-full h-full object-cover object-top" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Momentum</p>
            <p className="text-hype-text font-black text-lg metric-display tabular">{featuredScore}</p>
          </div>
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Score</p>
            <p className="text-hype-text font-black text-lg metric-display">
              {featured.creatorScore}<span className="text-hype-dim text-xs font-normal">/100</span>
            </p>
          </div>
          <div className="inset-surface rounded-2xl p-3">
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Fans</p>
            <p className="text-hype-text font-black text-lg metric-display">{featured.followers}</p>
          </div>
        </div>

        <button
          onClick={() => trade.openBuy(featured)}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(201,168,76,0.18)]"
        >
          Spot {featured.name.split(' ')[0]}
          <ArrowRight size={14} />
        </button>
      </motion.section>

      <motion.section {...sectionReveal} className="py-8">
        <div className="px-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-hype-text font-black text-xl leading-none tracking-tight">Culture Picks</p>
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
            <CreatorPortraitCard key={c.id} creator={c} onBuy={trade.openBuy} delay={i * 0.06} />
          ))}
        </div>
      </motion.section>

      {openIPOs.length > 0 && (
        <motion.section {...sectionReveal} className="px-5 py-8 border-t border-hype-border/50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-hype-text font-black text-xl leading-none tracking-tight">Breaking Through</p>
              <p className="text-hype-muted text-xs mt-1">Discover them first</p>
            </div>
            <Link href="/ipos">
              <span className="text-hype-muted text-xs flex items-center gap-0.5 hover:text-hype-secondary transition-colors">
                All Debuts <ChevronRight size={12} />
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

      <motion.section {...sectionReveal} className="px-5 py-8 border-t border-hype-border/50 pb-32">
        <div className="mb-6">
          <p className="text-hype-text font-black text-xl leading-none tracking-tight">The Conversation</p>
          <p className="text-hype-muted text-xs mt-1">What the community is saying</p>
        </div>
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-hype-dim text-[10px] leading-relaxed max-w-[280px] mx-auto">
            SPOTLIGHT is a demonstration platform. Cultural Shares represent discovery participation, not equity ownership. Not investment advice.
          </p>
        </div>
      </motion.section>

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
