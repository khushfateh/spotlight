'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronDown, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { getMomentumDrivers, type MomentumDriver } from '@/lib/mock-data/momentum-drivers'
import { getEarlySpotters } from '@/lib/mock-data/spots'
import { getGenresForCreator } from '@/lib/mock-data/genres'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import { useSpotlightCreator } from '@/hooks/useSpotlightCreator'
import { useAuth } from '@/context/AuthContext'
import { useSpots } from '@/hooks/useSpots'
import SpotterAuthModal from '@/components/auth/SpotterAuthModal'
import { trackAnonymousSpotAttempt } from '@/lib/services/anonymousTrackingService'
import type { Creator } from '@/types'

type WhyCard = { heading: string; body: string }

function buildWhyCards(creator: Creator, drivers: MomentumDriver[]): WhyCard[] {
  const cards: WhyCard[] = [
    { heading: 'Why they matter.', body: creator.bio },
  ]

  const growthStats = drivers
    .filter(d => d.category === 'growth' && (d.value || d.delta))
    .slice(0, 2)
    .map(d => `${d.label}${d.value ? ': ' + d.value : ''}${d.delta ? ' (' + d.delta + ')' : ''}`)
    .join('. ')

  if (growthStats) {
    cards.push({
      heading: "The numbers don't lie.",
      body: `${growthStats}. The data paints a clear picture — this isn't a flash in the pan, it's a trajectory.`,
    })
  }

  const nextCatalysts = drivers
    .filter(d => ['catalysts', 'events'].includes(d.category))
    .slice(0, 2)
    .map(d => d.label)

  if (nextCatalysts.length > 0) {
    const joined = nextCatalysts.length === 1
      ? nextCatalysts[0]
      : nextCatalysts[0] + ' and ' + nextCatalysts[1]
    cards.push({
      heading: "What's next.",
      body: `${joined}. These are the kinds of milestones that redefine a creator's trajectory — and the early spotters are already paying attention.`,
    })
  }

  if (cards.length === 1) {
    cards.push({
      heading: 'On the rise.',
      body: creator.story ?? 'Momentum is building. The community has noticed, and the signals are pointing up.',
    })
  }

  return cards
}

const DRIVER_CATEGORY_COLORS: Record<string, string> = {
  growth: 'text-emerald-400',
  community: 'text-blue-400',
  catalysts: 'text-hype-gold',
  discussion: 'text-purple-400',
  events: 'text-orange-400',
}

const EDITORIAL_IMAGE_MAP: Record<string, string> = {
  APDHILLON:   'https://images.unsplash.com/photo-1493225457124-a3eb4598d050?auto=format&fit=crop&w=1200&q=85',
  SABRINA:     'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
  TYLERTC:     'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=1200&q=85',
  PESOPLUMA:   'https://images.unsplash.com/photo-1493225457124-a3eb4598d050?auto=format&fit=crop&w=1200&q=85',
  NEWJEANS:    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
}
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1493225457124-a3eb4598d050?auto=format&fit=crop&w=1200&q=85'

export default function SpotlightPage() {
  const trade = useTradeSheet()
  const { isAuthenticated } = useAuth()
  const { spottedTickers } = useSpots()
  const [showSpotterAuth, setShowSpotterAuth] = useState(false)
  const { scrollY } = useScroll()
  const { creator, loading: spotlightLoading, error: spotlightError, retry: retrySpotlight } = useSpotlightCreator()

  const heroOpacity = useTransform(scrollY, [0, 280], [1, 0])
  const heroScale = useTransform(scrollY, [0, 280], [1, 1.08])
  const heroY = useTransform(scrollY, [0, 280], [0, -60])

  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isDeltaUp = delta >= 0
  const firstName = creator.name.split(' ')[0]
  const drivers = getMomentumDrivers(creator.ticker)
  const spotters = getEarlySpotters(creator.ticker, 5)
  const genres = getGenresForCreator(creator.ticker)
  const whyCards = buildWhyCards(creator, drivers)
  const editorialImage = EDITORIAL_IMAGE_MAP[creator.ticker] ?? FALLBACK_IMAGE

  if (spotlightLoading) {
    return (
      <div className="min-h-screen bg-hype-bg animate-pulse">
        <div className="h-[92vh] max-h-[700px] bg-white/5" />
        <div className="px-5 py-8 space-y-4">
          <div className="h-4 w-24 bg-white/8 rounded-full" />
          <div className="h-8 w-48 bg-white/10 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-2xl" />
        </div>
      </div>
    )
  }

  function openSpot() {
    if (!isAuthenticated) {
      trackAnonymousSpotAttempt(creator.ticker, 'spotlight_page').catch(() => {})
      setShowSpotterAuth(true)
    } else {
      trade.openBuy(creator!)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function openMoveOn() { trade.openSell(creator!) }

  return (
    <div className="min-h-screen bg-hype-bg relative">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative h-[92vh] max-h-[700px] overflow-hidden">
        {/* Parallax image */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: heroScale, y: heroY }}
        >
          <img
            src={editorialImage}
            alt={creator.name}
            className="w-full h-full object-cover object-top"
          />
        </motion.div>

        {/* Aurora overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="aurora-orb-1 absolute w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(107,33,168,0.35) 0%, transparent 70%)', top: '-15%', right: '-15%' }} />
          <div className="aurora-orb-3 absolute w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.25) 0%, transparent 70%)', bottom: '20%', left: '-10%' }} />
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-hype-bg via-hype-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-hype-bg/50 via-transparent to-hype-bg/30" />

        {/* Hero content */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end px-5 pb-8"
          style={{ opacity: heroOpacity }}
        >
          {/* Date editorial badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hype-gold/20 border border-hype-gold/30 text-hype-gold text-[10px] font-bold uppercase tracking-widest">
              <Zap size={9} /> Today&apos;s Spotlight
            </span>
          </div>

          <h1 className="text-white font-black text-5xl tracking-tight leading-none mb-2 font-display">
            {creator.name}
          </h1>

          {/* Genre tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {genres.slice(0, 3).map(g => (
              <span key={g.id} className="glass-gold text-white/70 text-xs px-2.5 py-0.5 rounded-full">
                {g.label}
              </span>
            ))}
          </div>

          {/* Momentum strip */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Momentum</p>
              <p className="text-white font-black text-4xl leading-none text-glow-gold">{score}</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">This week</p>
              <p className={`font-bold text-lg flex items-center gap-1 ${isDeltaUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isDeltaUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {isDeltaUp ? '+' : ''}{delta} pts
              </p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Status</p>
              <p className="text-hype-gold font-bold text-sm">{tier}</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            {spottedTickers.includes(creator.ticker.toUpperCase()) ? (
              <div className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.45)', color: 'rgba(201,168,76,0.9)' }}>
                ✦ Spotted
              </div>
            ) : (
              <motion.button
                onClick={openSpot}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-magnetic glow-gold flex-1 h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm hover:bg-hype-gold-dim transition-all"
              >
                Spot {firstName}
              </motion.button>
            )}
            <button
              onClick={() => {}}
              className="px-5 h-12 rounded-2xl border border-white/20 text-white text-sm font-medium hover:border-white/40 transition-all"
            >
              Follow
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ opacity: heroOpacity }}
        >
          <ChevronDown size={20} className="text-white/30" />
        </motion.div>
      </div>

      {/* ── EDITORIAL BODY ───────────────────────────────────────────────── */}
      <div className="px-5 pb-32">

        {/* Fallback notice — shown only when personalisation API failed */}
        {spotlightError && (
          <div className="pt-4 pb-2 flex items-center justify-between">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
              Featuring today&apos;s pick · Personalisation unavailable
            </p>
            <button
              onClick={retrySpotlight}
              className="text-white/30 text-[10px] font-semibold uppercase tracking-widest hover:text-white/50 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Editorial teaser */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="py-8 border-b border-hype-border"
        >
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em] mb-3">
            Why they matter
          </p>
          <p className="text-white/85 text-lg font-medium leading-relaxed">
            {creator.bio}
          </p>
        </motion.div>

        {/* Story cards — staggered fade-up with diagonal drift */}
        <div className="py-8 border-b border-hype-border">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em] mb-6"
          >
            The story
          </motion.p>
          <div className="space-y-8">
            {whyCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ type: 'spring', stiffness: 70, damping: 18, delay: i * 0.06 }}
              >
                <h3 className="text-hype-gold font-black text-lg mb-2">{card.heading}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Momentum Drivers */}
        {drivers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            className="py-8 border-b border-hype-border"
          >
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em] mb-5">
              What&apos;s driving momentum
            </p>
            <div className="space-y-3">
              {drivers.map((driver, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, x: i % 2 === 0 ? -12 : 12 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  whileHover={{ x: i % 2 === 0 ? 5 : -5 }}
                  transition={{ type: 'spring', stiffness: 70, damping: 18, delay: i * 0.05 }}
                  className="flex items-start justify-between gap-4 py-3 border-b border-hype-border/60 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{driver.label}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${DRIVER_CATEGORY_COLORS[driver.category] ?? 'text-white/40'}`}>
                      {driver.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {driver.value && (
                      <p className="text-white font-bold text-sm">{driver.value}</p>
                    )}
                    {driver.delta && (
                      <p className={`text-xs font-semibold ${driver.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {driver.delta}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Early Spotters — staggered fade-up */}
        {spotters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            className="py-8 border-b border-hype-border"
          >
            <div className="flex items-center gap-2 mb-5">
              <Users size={12} className="text-white/40" />
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                Early spotters
              </p>
            </div>
            <div className="space-y-3">
              {spotters.map((spotter, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, x: i % 2 === 0 ? -14 : 14 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ type: 'spring', stiffness: 70, damping: 18, delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {spotter.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{spotter.userName}</p>
                    {spotter.badge && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-hype-gold/15 text-hype-gold font-bold">
                        {spotter.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-white/35 text-xs flex-shrink-0">{spotter.daysAgo}d ago</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats — staggered fade-up */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="py-8 border-b border-hype-border"
        >
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em] mb-4">Creator stats</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Followers', value: creator.followers },
              { label: 'Creator Score', value: creator.creatorScore },
              { label: 'Tier', value: tier, gold: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ type: 'spring', stiffness: 70, damping: 18, delay: i * 0.08 }}
                className={`${stat.gold ? 'glass-gold' : 'glass'} rounded-2xl p-4 text-center`}
              >
                <p className={`font-black text-xl ${stat.gold ? 'text-hype-gold text-sm text-glow-gold' : 'text-white'}`}>{stat.value}</p>
                <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="pt-8">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.25em] mb-4 text-center">
            {spottedTickers.includes(creator.ticker.toUpperCase()) ? 'You already spotted this one.' : 'You spotted it first.'}
          </p>
          <div className="flex gap-3">
            {spottedTickers.includes(creator.ticker.toUpperCase()) ? (
              <div className="flex-1 h-13 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.45)', color: 'rgba(201,168,76,0.9)' }}>
                ✦ Spotted
              </div>
            ) : (
              <motion.button
                onClick={openSpot}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-magnetic glow-gold-sm flex-1 h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm hover:bg-hype-gold-dim transition-all"
              >
                Spot {firstName}
              </motion.button>
            )}
            <Link
              href={`/creator/${creator.ticker.toLowerCase()}`}
              className="px-5 h-13 py-3.5 rounded-2xl border border-white/20 text-white text-sm font-medium hover:border-white/40 transition-all flex items-center justify-center"
            >
              Full profile
            </Link>
          </div>
          <p className="text-center text-white/20 text-[10px] mt-3">
            Add to your Discoveries · Early access, not ownership · Mock only
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
        onSpotNow={trade.spotNow}
        onSubmitOrder={trade.submitOrder}
        onConfirmOrder={trade.confirmOrder}
        onReset={trade.reset}
      />

      {showSpotterAuth && (
        <SpotterAuthModal creator={creator} onClose={() => setShowSpotterAuth(false)} />
      )}
    </div>
  )
}
