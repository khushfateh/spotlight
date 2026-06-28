'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronRight, Info, Zap } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/components/community/PostCard'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import { useAuth } from '@/context/AuthContext'
import SpotterAuthModal from '@/components/auth/SpotterAuthModal'
import { trackAnonymousSpotAttempt } from '@/lib/services/anonymousTrackingService'
import { useSpots } from '@/hooks/useSpots'
import {
  creators,
  getTrendingCreators,
  communityPosts,
  getMomentum,
  getMomentumTier,
  getCreatorsByTickers,
} from '@/lib/mock-data'
import { reasonTypeLabel, type HomeSection } from '@/lib/mock-data/recommendations'
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed'
import { useMomentumRanking } from '@/hooks/useMomentumRanking'
import RecommendationDebugPanel from '@/components/dev/RecommendationDebugPanel'
import { cn } from '@/lib/utils'
import type { Creator } from '@/types'
import { MagneticSurface } from '@/components/experience/MagneticSurface'
import { SpotlightBeam } from '@/components/experience/SpotlightBeam'
import { premiumEase, softSpring, cinematicReveal } from '@/lib/motion/easing'

// ── Shared motion constants ─────────────────────────────────────────────────
const spring = softSpring

const slideLeft = {
  initial: { opacity: 0, x: -48 },
  whileInView: { opacity: 1 as number, x: 0 as number },
  viewport: { once: false, amount: 0.1 },
  transition: spring,
}
const slideRight = {
  initial: { opacity: 0, x: 48 },
  whileInView: { opacity: 1 as number, x: 0 as number },
  viewport: { once: false, amount: 0.1 },
  transition: spring,
}
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1 as number, y: 0 as number },
  viewport: { once: false, amount: 0.1 },
  transition: { ...spring },
}

// ── Reusable sub-components ─────────────────────────────────────────────────

function SpottedBadge() {
  return (
    <span className="spot-confirm inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-bold tracking-[0.12em] uppercase"
      style={{
        background: 'rgba(201,168,76,0.14)',
        border: '1px solid rgba(201,168,76,0.38)',
        color: 'rgba(201,168,76,0.92)',
        textShadow: '0 0 10px rgba(201,168,76,0.3)',
      }}>
      ✦ Spotted
    </span>
  )
}

// Scene label — cinematic terminal-style section identifier
function SceneLabel({ children, index }: { children: ReactNode; index?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="scene-label flex-1">{children}</div>
      {index !== undefined && (
        <span className="text-[9px] font-mono text-white/12 tracking-[0.3em] font-bold">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

// ── Cinematic Hero ──────────────────────────────────────────────────────────
function CinematicHero({
  featured,
  onBuy,
  discoveryCount,
  avgMomentum,
  isFeaturedSpotted,
}: {
  featured: Creator
  onBuy: (c: Creator) => void
  discoveryCount: number
  avgMomentum: number
  isFeaturedSpotted: boolean
}) {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const contentY = useTransform(scrollYProgress, [0, 0.7], [0, -80])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  const { score: featuredScore, delta: featuredDelta } = getMomentum(featured.ticker)
  const featuredTier = getMomentumTier(featuredScore)
  const isFeaturedUp = featuredDelta >= 0

  return (
    <section
      ref={heroRef}
      className="-mt-14 relative overflow-hidden"
      style={{ height: '100svh' }}
    >
      {/* ── Background image with parallax ─────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: bgScale, y: bgY }}
      >
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

      {/* ── Depth gradient layers ───────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/55 to-[#0A0A0A]/15" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent" />

      {/* ── Aurora overlays ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="aurora-orb-1 absolute w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(107,33,168,0.35) 0%, transparent 70%)', top: '-25%', right: '-18%' }} />
        <div className="aurora-orb-2 absolute w-[500px] h-[500px] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)', bottom: '8%', left: '-12%' }} />
      </div>

      {/* ── Cursor-reactive spotlight beam ──────────────────── */}
      <SpotlightBeam intensity={1.2} />

      {/* ── Animated signal lines ───────────────────────────── */}
      <div className="signal-lines" aria-hidden>
        <div className="signal-line" />
        <div className="signal-line" />
        <div className="signal-line" />
        <div className="signal-line" />
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Top — spotter count pill */}
        <div className="flex justify-end px-5 pt-[76px]">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...cinematicReveal, delay: 0.9 }}
          >
            <Link href="/portfolio">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/18 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-hype-gold live-price" />
                <span className="text-white text-[11px] font-semibold tabular">
                  {discoveryCount} spotted
                </span>
                <span className="text-hype-gold text-[10px] font-medium tabular">
                  avg {avgMomentum}
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="flex-1" />

        {/* Bottom — hero content */}
        <div className="px-5 pb-28 sm:pb-32">
          {/* Culture terminal tag */}
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...cinematicReveal, delay: 0.15 }}
          >
            <div className="data-readout flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-hype-gold live-price" />
              <span>CULTURE SIGNAL · {featured.category} · {featured.ticker}</span>
            </div>
          </motion.div>

          {/* Artist name — cinematic word-by-word reveal */}
          <h1
            className="text-white font-black tracking-tight leading-none mb-3 font-display"
            style={{ fontSize: 'clamp(2.6rem, 12vw, 5.5rem)', textShadow: '0 2px 40px rgba(0,0,0,0.8)' }}
          >
            {featured.name.split(' ').map((word, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '115%', filter: 'blur(4px)' }}
                  animate={{ y: '0%', filter: 'blur(0px)' }}
                  transition={{ duration: 0.78, ease: premiumEase, delay: 0.22 + i * 0.13 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Tagline */}
          <motion.p
            className="text-white/35 text-[11px] font-semibold tracking-[0.18em] uppercase mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            Discover future icons before everyone else.
          </motion.p>

          {featured.story && (
            <motion.p
              className="text-white/50 text-sm leading-relaxed mb-6 max-w-[300px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.68 }}
            >
              {featured.story}
            </motion.p>
          )}

          {/* CTA row */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: premiumEase, delay: 0.75 }}
          >
            {isFeaturedSpotted ? (
              <div className="spot-confirm inline-flex items-center gap-2 px-5 py-3 rounded-2xl"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  border: '1.5px solid rgba(201,168,76,0.45)',
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'rgba(201,168,76,0.9)',
                  textShadow: '0 0 14px rgba(201,168,76,0.4)',
                }}>
                ✦ Spotted
              </div>
            ) : (
              <motion.button
                onClick={() => onBuy(featured)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="btn-magnetic spot-btn-glow flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all shadow-[0_4px_28px_rgba(201,168,76,0.35)]"
              >
                Spot {featured.name.split(' ')[0]} <ArrowRight size={14} />
              </motion.button>
            )}

            <div className="text-right">
              <p className="text-white font-black text-xl tabular tracking-tight leading-none">
                {featuredScore}
              </p>
              <p className={cn('text-xs font-semibold tabular mt-1', isFeaturedUp ? 'text-hype-green' : 'text-hype-red')}>
                {isFeaturedUp ? '+' : ''}{featuredDelta} pts · {featuredTier}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none"
        style={{ opacity: scrollHintOpacity }}
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-white/30 text-[9px] font-medium tracking-widest uppercase">Explore</span>
          <ChevronDown size={14} className="text-white/30" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ── Creator Portrait Card (horizontal scroll) ───────────────────────────────
function CreatorPortraitCard({
  creator,
  onBuy,
  delay = 0,
  isSpotted = false,
}: {
  creator: Creator
  onBuy: (c: Creator) => void
  delay?: number
  isSpotted?: boolean
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 56, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: false }}
      transition={{ ...spring, delay }}
      className="flex-shrink-0"
      style={{ width: 176 }}
    >
      <MagneticSurface strength={0.2} tiltMax={6}>
        <div className="creator-card rim-light card-glow relative group cursor-pointer rounded-3xl">
          <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
            <div
              className="glass-premium relative rounded-3xl overflow-hidden"
              style={{ height: 264 }}
            >
              {/* Image with depth parallax */}
              {creator.imageUrl ? (
                <img
                  src={creator.imageUrl}
                  alt={creator.name}
                  className="card-img-parallax absolute inset-0 w-full h-full object-cover object-top"
                />
              ) : (
                <div className={cn('card-img-parallax absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/96 via-black/20 to-black/5" />

              {/* Cursor spotlight on card */}
              <SpotlightBeam intensity={0.7} />

              {/* Score peek on hover */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                <span className="data-readout">Score {creator.creatorScore}/100</span>
              </div>

              {/* Spot / Spotted badge */}
              {isSpotted ? (
                <div className="absolute top-3 right-3">
                  <SpottedBadge />
                </div>
              ) : (
                <button
                  onClick={e => { e.preventDefault(); onBuy(creator) }}
                  className="btn-magnetic spot-btn-glow absolute top-3 right-3 px-2.5 py-1 bg-hype-gold text-[#0A0A0A] text-[9px] font-bold rounded-full transition-all active:scale-95 hover:bg-hype-gold-dim"
                >
                  Spot
                </button>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-[14px] leading-tight tracking-tight">{creator.name}</p>
                <p className="text-white/30 text-[9px] font-mono tracking-wider mt-0.5 mb-1.5">${creator.ticker}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-black text-sm tabular score-pop">{score}</p>
                  <p className={cn('text-[10px] font-semibold tabular', isUp ? 'text-hype-green' : 'text-hype-red')}>
                    {isUp ? '+' : ''}{delta} pts
                  </p>
                </div>
                <p className="text-hype-gold text-[8px] font-bold uppercase tracking-wider mt-0.5">{tier}</p>
              </div>
            </div>
          </Link>
        </div>
      </MagneticSurface>
    </motion.div>
  )
}

// ── Hidden Gem Card ─────────────────────────────────────────────────────────
function HiddenGemCard({
  creator,
  onBuy,
  isSpotted = false,
}: {
  creator: Creator
  onBuy: (c: Creator) => void
  isSpotted?: boolean
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <MagneticSurface strength={0.12} tiltMax={3}>
      <div className="glass-premium rim-light relative rounded-3xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)' }} />
        <SpotlightBeam intensity={0.8} />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              {creator.imageUrl ? (
                <div className="w-20 h-20 rounded-full overflow-hidden"
                  style={{ border: '2px solid rgba(201,168,76,0.4)', boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}>
                  <img src={creator.imageUrl} alt={creator.name} className="w-full h-full object-cover object-center" />
                </div>
              ) : (
                <div className={cn('w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-black', creator.coverColor)}
                  style={{ border: '2px solid rgba(201,168,76,0.4)', boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}>
                  {creator.avatar}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-xl leading-tight tracking-tight mb-0.5">{creator.name}</p>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-3">{creator.category}</p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-hype-gold font-black text-lg leading-none">{score}</p>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider">Score</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className={`font-bold text-sm leading-none ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{delta}
                  </p>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider">This week</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-white/70 font-semibold text-xs leading-none">{tier}</p>
                  <p className="text-white/30 text-[9px] uppercase tracking-wider">Tier</p>
                </div>
              </div>
            </div>
          </div>
          {creator.bio && (
            <p className="text-white/40 text-xs leading-relaxed mt-4 line-clamp-2">{creator.bio}</p>
          )}
          <motion.button
            onClick={() => onBuy(creator)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
            style={isSpotted
              ? { background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'rgba(201,168,76,0.7)' }
              : { background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)', color: '#0A0A0A' }
            }
          >
            {isSpotted ? '✓ You spotted this gem' : `💎 Be first to spot ${creator.name.split(' ')[0]}`}
          </motion.button>
        </div>
      </div>
    </MagneticSurface>
  )
}

// ── Featured Creator Card ───────────────────────────────────────────────────
function FeaturedCreatorCard({
  creator,
  onBuy,
  isSpotted = false,
}: {
  creator: Creator
  onBuy: (c: Creator) => void
  isSpotted?: boolean
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <MagneticSurface strength={0.12} tiltMax={3}>
      <div className="creator-card rim-light relative rounded-3xl overflow-hidden glass-premium" style={{ height: 220 }}>
        {creator.imageUrl ? (
          <img src={creator.imageUrl} alt={creator.name}
            className="card-img-parallax absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className={cn('card-img-parallax absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <SpotlightBeam intensity={0.6} />

        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hype-gold/20 border border-hype-gold/30 text-hype-gold text-[9px] font-bold uppercase tracking-wider">
            <Zap size={8} /> {tier}
          </span>
          {isSpotted && <SpottedBadge />}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-2xl leading-tight tracking-tight">{creator.name}</p>
            <p className="text-white/40 text-[10px] font-mono tracking-wider mt-0.5">${creator.ticker}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-black text-3xl leading-none score-pop">{score}</p>
            <p className={cn('text-xs font-semibold mt-0.5', isUp ? 'text-hype-green' : 'text-hype-red')}>
              {isUp ? '+' : ''}{delta} pts
            </p>
          </div>
        </div>
      </div>
    </MagneticSurface>
  )
}

// ── Personalized Section ────────────────────────────────────────────────────
function PersonalizedSection({
  section,
  onBuy,
  spottedTickers,
  sectionIndex = 0,
}: {
  section: HomeSection
  onBuy: (c: Creator) => void
  spottedTickers: string[]
  sectionIndex?: number
}) {
  const sectionCreators = getCreatorsByTickers(section.tickers)
  if (sectionCreators.length === 0) return null

  const reasonLabel = section.reasonLabel ?? (section.reasonType ? reasonTypeLabel[section.reasonType] : undefined)

  return (
    <>
      <div className="section-divider mx-5" />
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.08 }}
        transition={{ ...spring, delay: sectionIndex * 0.04 }}
        className="py-7"
      >
        <div className="px-5 mb-5">
          <SceneLabel index={sectionIndex}>Today&apos;s Signal</SceneLabel>
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
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hype-gold/10 border border-hype-gold/20 text-hype-gold text-[10px] font-semibold">
                <Info size={9} />
                {reasonLabel}
              </span>
            </div>
          )}
        </div>

        {section.layout === 'featured' && sectionCreators[0] && (
          <div className="px-5">
            {section.reasonType === 'hidden_gem' ? (
              <HiddenGemCard
                creator={sectionCreators[0]}
                onBuy={onBuy}
                isSpotted={spottedTickers.includes(sectionCreators[0].ticker.toUpperCase())}
              />
            ) : (
              <FeaturedCreatorCard
                creator={sectionCreators[0]}
                onBuy={onBuy}
                isSpotted={spottedTickers.includes(sectionCreators[0].ticker.toUpperCase())}
              />
            )}
          </div>
        )}

        {section.layout === 'horizontal' && (
          <div className="flex gap-4 pl-5 overflow-x-auto hide-scrollbar pb-2" style={{ paddingRight: 20 }}>
            {sectionCreators.map((c, i) => (
              <CreatorPortraitCard
                key={c.id}
                creator={c}
                onBuy={onBuy}
                delay={i * 0.05}
                isSpotted={spottedTickers.includes(c.ticker.toUpperCase())}
              />
            ))}
          </div>
        )}
      </motion.section>
    </>
  )
}

// ── Premium loading skeleton ─────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="py-7">
      <div className="section-divider mx-5 mb-5" />
      <div className="px-5 mb-5">
        <div className="h-3 w-32 shimmer-premium rounded-full mb-3" />
        <div className="h-5 w-52 shimmer-premium rounded-lg mb-2" />
        <div className="h-3 w-36 bg-white/4 rounded-md mb-3" />
        <div className="h-7 w-40 shimmer-premium rounded-full" />
      </div>
      <div className="flex gap-4 pl-5 overflow-hidden" style={{ paddingRight: 20 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-shrink-0 rounded-3xl shimmer-premium" style={{ width: 176, height: 264 }} />
        ))}
      </div>
    </div>
  )
}

// ── Hero skeleton (premium) ──────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="-mt-14 relative overflow-hidden bg-[#0A0A0A]" style={{ height: '100svh' }}>
      {/* Ambient gradient while loading */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 shimmer-premium opacity-30" />
      <div className="absolute bottom-0 left-0 px-5 pb-28 w-full">
        <div className="h-3 w-36 shimmer-premium rounded-full mb-5" />
        <div className="h-16 w-72 shimmer-premium rounded-2xl mb-3" />
        <div className="h-14 w-56 shimmer-premium rounded-2xl mb-6" />
        <div className="h-4 w-80 bg-white/4 rounded-full mb-2" />
        <div className="h-14 w-40 shimmer-premium rounded-2xl mt-4" />
      </div>
    </div>
  )
}

// ── Home Feed ────────────────────────────────────────────────────────────────
export default function HomeFeed() {
  const trade = useTradeSheet()
  const { currentUser, isAuthenticated } = useAuth()
  const { spottedTickers } = useSpots()
  const [spotterAuthCreator, setSpotterAuthCreator] = useState<Creator | null>(null)

  function handleBuy(creator: Creator) {
    if (!isAuthenticated) {
      trackAnonymousSpotAttempt(creator.ticker, 'home_feed').catch(() => {})
      setSpotterAuthCreator(creator)
    } else {
      trade.openBuy(creator)
    }
  }

  const { entries: momentumEntries, hasData: hasMomentumData, loading: momentumLoading } = useMomentumRanking()
  const trending = getTrendingCreators(6)

  const featured: Creator | null = momentumLoading ? null : (() => {
    if (hasMomentumData && momentumEntries.length > 0) {
      const top = momentumEntries.find(e => e.score > 0) ?? momentumEntries[0]
      const found = (creators as Creator[]).find(
        c => c.ticker.toUpperCase() === top.ticker.toUpperCase()
      )
      if (found) return found
    }
    return trending[0]
  })()

  const posts = communityPosts.slice(0, 3)
  const activeTickers = spottedTickers
  const discoveryCount = activeTickers.length
  const avgMomentum = activeTickers.length
    ? Math.round(activeTickers.reduce((sum, t) => sum + getMomentum(t).score, 0) / activeTickers.length)
    : 0
  const { score: featuredScore } = getMomentum(featured?.ticker ?? '')
  const { sections: homeSections, loading: sectionsLoading } = usePersonalizedFeed()

  // ── Render states ─────────────────────────────────────────────────────────

  if (momentumLoading) return <HeroSkeleton />
  if (!featured) return null

  return (
    <>
      {/* ── Cinematic Hero ─────────────────────────────────────────── */}
      <CinematicHero
        featured={featured}
        onBuy={handleBuy}
        discoveryCount={discoveryCount}
        avgMomentum={avgMomentum}
        isFeaturedSpotted={activeTickers.includes(featured.ticker.toUpperCase())}
      />

      <div style={{ overflowX: 'clip' }}>

        {/* ── 01 — Live Momentum ──────────────────────────────────── */}
        <motion.div {...slideLeft} className="px-5 py-6">
          <div className="section-divider mb-5" />
          <SceneLabel index={0}>Live Momentum</SceneLabel>
          <div className="glass-premium rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-hype-green live-price"
                style={{ boxShadow: '0 0 8px #10B981, 0 0 16px rgba(16,185,129,0.4)' }} />
              <span className="text-white/50 text-[9px] font-bold tracking-[0.22em] uppercase">
                Signal · Realtime
              </span>
            </div>
            <div className="flex gap-6 overflow-x-auto hide-scrollbar">
              {trending.slice(0, 5).map((c, i) => {
                const { score, delta } = getMomentum(c.ticker)
                const tier = getMomentumTier(score)
                const up = delta >= 0
                return (
                  <Link key={c.id} href={`/creator/${c.ticker.toLowerCase()}`} className="flex-shrink-0 group">
                    <p className="text-hype-dim text-[9px] font-mono tracking-wider mb-0.5">${c.ticker}</p>
                    <p className="text-hype-text text-sm font-black tabular group-hover:text-white transition-colors live-price"
                      style={{ animationDelay: `${i * 0.55}s` }}>
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
          </div>
        </motion.div>

        {/* ── 02 — Daily Briefing header ──────────────────────────── */}
        <motion.div {...slideRight} className="px-5 pt-6 pb-3 relative overflow-hidden">
          <div className="section-divider mb-5" />
          <SceneLabel index={1}>Daily Briefing</SceneLabel>
          <span
            aria-hidden
            className="absolute right-4 top-0 font-black font-display leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(4rem, 20vw, 6.5rem)', color: 'rgba(255,255,255,0.025)', letterSpacing: '-0.04em' }}
          >02</span>
          <h2 className="text-white font-black text-2xl tracking-tight">
            {currentUser
              ? `Good morning, ${currentUser.name.split(' ')[0]}.`
              : 'What to watch today.'}
          </h2>
          <p className="text-white/30 text-xs mt-1">
            {currentUser ? 'Your personalised cultural radar.' : 'The artists moving the culture right now.'}
          </p>
        </motion.div>

        {/* ── Personalised sections ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {sectionsLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SectionSkeleton />
              <SectionSkeleton />
            </motion.div>
          ) : homeSections.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={cinematicReveal}
              className="px-5 py-12 text-center"
            >
              <div className="section-divider mb-8" />
              <p className="text-hype-muted text-sm font-medium mb-1">No signals yet</p>
              <p className="text-hype-dim text-xs">Spot some creators to personalise your cultural radar</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {homeSections.map((section, i) => (
                <PersonalizedSection
                  key={section.id}
                  section={section}
                  onBuy={handleBuy}
                  spottedTickers={activeTickers}
                  sectionIndex={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 03 — This Week in Culture ───────────────────────────── */}
        <motion.section {...slideLeft} className="px-5 py-7 relative overflow-hidden">
          <div className="section-divider mb-5" />
          <span aria-hidden className="absolute right-4 top-2 font-black font-display leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(4rem, 20vw, 6.5rem)', color: 'rgba(255,255,255,0.022)', letterSpacing: '-0.04em' }}>03</span>

          <SceneLabel index={2}>This Week in Culture</SceneLabel>

          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <h2 className="text-hype-text font-black text-2xl tracking-tight leading-tight mb-2">
                {featured.name}
              </h2>
              <p className="text-hype-secondary text-sm leading-relaxed">
                {featured.bio.split('.')[0]}.
              </p>
            </div>
            {featured.imageUrl && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-hype-border">
                <img src={featured.imageUrl} alt={featured.name} className="w-full h-full object-cover object-top" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="glass-premium rounded-2xl p-3">
              <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Momentum</p>
              <p className="text-hype-text font-black text-lg tabular score-pop">{featuredScore}</p>
            </div>
            <div className="glass-premium rounded-2xl p-3">
              <p className="text-hype-dim text-[9px] uppercase tracking-wider mb-1.5">Creator Score</p>
              <p className="text-hype-text font-black text-lg">
                {featured.creatorScore}<span className="text-hype-dim text-xs font-normal">/100</span>
              </p>
            </div>
          </div>

          {activeTickers.includes(featured.ticker.toUpperCase()) ? (
            <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold spot-confirm"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1.5px solid rgba(201,168,76,0.45)', color: 'rgba(201,168,76,0.9)' }}>
              ✦ Spotted
            </div>
          ) : (
            <motion.button
              onClick={() => handleBuy(featured)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-magnetic spot-btn-glow w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all shadow-[0_4px_20px_rgba(201,168,76,0.25)]"
            >
              Spot {featured.name.split(' ')[0]}
              <ArrowRight size={14} />
            </motion.button>
          )}
        </motion.section>

        {/* ── 04 — Culture Picks ──────────────────────────────────── */}
        <motion.section {...slideRight} className="py-7 relative overflow-hidden">
          <div className="section-divider mx-5 mb-5" />
          <span aria-hidden className="absolute right-4 top-2 font-black font-display leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(4rem, 20vw, 6.5rem)', color: 'rgba(255,255,255,0.022)', letterSpacing: '-0.04em' }}>04</span>

          <div className="px-5 mb-5">
            <SceneLabel index={3}>Culture Picks</SceneLabel>
            <div className="flex items-center justify-between">
              <h2 className="text-hype-text font-black text-xl leading-none tracking-tight">
                Trending Now
              </h2>
              <Link href="/explore">
                <span className="text-hype-muted text-xs flex items-center gap-0.5 hover:text-hype-secondary transition-colors">
                  See all <ChevronRight size={12} />
                </span>
              </Link>
            </div>
            <p className="text-hype-muted text-xs mt-0.5">Momentum · 24h</p>
          </div>

          <div className="flex gap-4 pl-5 overflow-x-auto hide-scrollbar pb-2" style={{ paddingRight: 20 }}>
            {trending.map((c, i) => (
              <CreatorPortraitCard
                key={c.id}
                creator={c}
                onBuy={handleBuy}
                delay={i * 0.07}
                isSpotted={activeTickers.includes(c.ticker.toUpperCase())}
              />
            ))}
          </div>
        </motion.section>

        {/* ── 05 — The Conversation ───────────────────────────────── */}
        <motion.section {...slideLeft} className="px-5 py-7 border-t border-hype-border/30 pb-36 relative overflow-hidden">
          <div className="section-divider mb-5" />
          <span aria-hidden className="absolute right-0 top-2 font-black font-display leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(4rem, 20vw, 6.5rem)', color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.04em' }}>05</span>

          <SceneLabel index={4}>Community</SceneLabel>
          <div className="mb-5">
            <h2 className="text-hype-text font-black text-xl leading-none tracking-tight">The Conversation</h2>
            <p className="text-hype-muted text-xs mt-1">What the community is saying</p>
          </div>

          <div className="space-y-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ ...spring, delay: i * 0.07 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-hype-dim text-[10px] leading-relaxed max-w-[280px] mx-auto">
              SPOTLIGHT is a discovery platform. Cultural Spots represent discovery participation, not equity ownership. Not investment advice.
            </p>
          </div>
        </motion.section>

      </div>{/* end overflowX clip */}

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

      <RecommendationDebugPanel />

      {spotterAuthCreator && (
        <SpotterAuthModal creator={spotterAuthCreator} onClose={() => setSpotterAuthCreator(null)} />
      )}
    </>
  )
}
