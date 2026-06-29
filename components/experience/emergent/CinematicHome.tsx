'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, ChevronRight, Info } from 'lucide-react'
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

const spring = { type: 'spring' as const, stiffness: 70, damping: 18 }

// ── Shared sub-components ─────────────────────────────────────────────────────

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 25 })
  const sy = useSpring(y, { stiffness: 200, damping: 25 })
  const rX = useTransform(sy, [-0.5, 0.5], [5, -5])
  const rY = useTransform(sx, [-0.5, 0.5], [-5, 5])
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 700 }}
      onMouseMove={e => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left) / r.width - 0.5)
        y.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SpottedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 9px', borderRadius: 20,
      background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.34)',
      fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'rgba(201,168,76,0.9)',
    }}>✦ Spotted</span>
  )
}

// Fine gold constellation divider between sections
function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 20px' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.14), transparent)' }} />
      <span style={{ color: 'rgba(201,168,76,0.22)', fontSize: 7 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.14), transparent)' }} />
    </div>
  )
}

// Ghost section number — editorial watermark
function WatermarkNum({ n }: { n: string }) {
  return (
    <span aria-hidden style={{
      position: 'absolute', right: 16, top: 0,
      fontFamily: 'Syne, sans-serif',
      fontSize: 'clamp(4.5rem, 20vw, 6.5rem)',
      fontWeight: 900, color: 'rgba(255,255,255,0.02)',
      letterSpacing: '-0.04em', lineHeight: 1,
      pointerEvents: 'none', userSelect: 'none',
    }}>{n}</span>
  )
}

// Mono label — section eyebrow
const MONO: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9, letterSpacing: '0.26em',
  textTransform: 'uppercase',
}

// ── Featured artist ──────────────────────────────────────────────────────────
// Artist lives inside a glass card — NOT as a page background — so sparkles
// and the fixed gold canvas show through the surrounding space.
function FeaturedSection({
  featured,
  onBuy,
  isFeaturedSpotted,
}: {
  featured: Creator
  onBuy: (c: Creator) => void
  isFeaturedSpotted: boolean
}) {
  const { score, delta } = getMomentum(featured.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '32px 20px 16px' }}
    >
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ ...MONO, color: '#c9a84c' }}>✦ Featured Artist</span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.2), transparent)' }} />
        <span style={{ ...MONO, color: 'rgba(255,255,255,0.16)' }}>{featured.category}</span>
      </div>

      {/* Portrait glass card */}
      <TiltCard>
        <div
          className="glass"
          style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 410 }}
        >
          {/* Gold shimmer edge */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, borderRadius: 24, boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.45), inset 0 -1px 0 rgba(255,255,255,0.03)' }} />

          {featured.imageUrl ? (
            <img
              src={featured.imageUrl}
              alt={featured.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top 8%' }}
              draggable={false}
            />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', featured.coverColor)} />
          )}

          {/* Dark gradient — readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.52) 42%, rgba(5,5,5,0.08) 78%, transparent 100%)' }} />

          {/* Momentum chip — top right */}
          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 4 }}>
            {isFeaturedSpotted ? (
              <SpottedBadge />
            ) : (
              <div className="glass" style={{ borderRadius: 20, padding: '4px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ ...MONO, color: isUp ? '#10b981' : '#ef4444', fontSize: 8 }}>
                  {isUp ? '↑' : '↓'} {Math.abs(delta)} pts
                </span>
              </div>
            )}
          </div>

          {/* Info overlay — bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 22px', zIndex: 2 }}>
            <div style={{ ...MONO, color: 'rgba(201,168,76,0.65)', marginBottom: 6 }}>
              ${featured.ticker} · {tier}
            </div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(2rem, 9vw, 2.8rem)',
              fontWeight: 800, color: '#f5f5f5',
              margin: '0 0 12px', lineHeight: 1,
              letterSpacing: '-0.025em',
            }}>
              {featured.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#f4d488', lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ ...MONO, fontSize: 7, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>Momentum</div>
              </div>
              {featured.bio && (
                <>
                  <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 1.55, margin: 0, flex: 1 }}>
                    {featured.bio.split('.')[0]}.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </TiltCard>

      {/* CTA */}
      <div style={{ marginTop: 14 }}>
        {isFeaturedSpotted ? (
          <div
            className="glass-gold"
            style={{ height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.8)', fontSize: 13, fontWeight: 700 }}
          >
            ✦ Spotted
          </div>
        ) : (
          <motion.button
            onClick={() => onBuy(featured)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', height: 48, borderRadius: 16,
              background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
              color: '#0a0a0a', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.38)',
            }}
          >
            Spot {featured.name.split(' ')[0]} <ArrowRight size={15} />
          </motion.button>
        )}
      </div>
    </motion.section>
  )
}

// ── Live momentum strip ──────────────────────────────────────────────────────
function MomentumStrip({ list }: { list: Creator[] }) {
  return (
    <section style={{ padding: '6px 20px' }}>
      <div className="glass" style={{ borderRadius: 18, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', flexShrink: 0 }} />
          <span style={{ ...MONO, color: '#a3a3a3' }}>Live Momentum</span>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 22, overflowX: 'auto' }}>
          {list.slice(0, 5).map((c, i) => {
            const { score, delta } = getMomentum(c.ticker)
            const up = delta >= 0
            return (
              <Link key={c.id} href={`/creator/${c.ticker.toLowerCase()}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ ...MONO, fontSize: 8, color: 'rgba(255,255,255,0.28)', marginBottom: 2 }}>${c.ticker}</div>
                <div
                  className="live-price"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#f5f5f5', lineHeight: 1, animationDelay: `${i * 0.55}s` }}
                >
                  {score}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: up ? '#10b981' : '#ef4444', marginTop: 2 }}>
                  {up ? '+' : ''}{delta}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Creator portrait card ────────────────────────────────────────────────────
function CreatorCard({
  creator, onBuy, delay = 0, isSpotted = false,
}: {
  creator: Creator; onBuy: (c: Creator) => void; delay?: number; isSpotted?: boolean
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false }}
      transition={{ ...spring, delay }}
      style={{ flexShrink: 0, width: 176 }}
    >
      <TiltCard>
        <div
          className="glass creator-card"
          style={{ borderRadius: 24, overflow: 'hidden', height: 264, position: 'relative' }}
        >
          {creator.imageUrl ? (
            <img
              src={creator.imageUrl} alt={creator.name}
              className="card-img-parallax"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            <div className={cn('card-img-parallax absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.18) 60%, transparent 100%)' }} />

          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
            {isSpotted ? (
              <SpottedBadge />
            ) : (
              <button
                onClick={e => { e.preventDefault(); onBuy(creator) }}
                className="btn-magnetic spot-btn-glow"
                style={{ padding: '3px 10px', borderRadius: 20, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#0a0a0a', fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Spot
              </button>
            )}
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 14px', zIndex: 2 }}>
            <div style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 14, lineHeight: 1.2, marginBottom: 2 }}>{creator.name}</div>
            <div style={{ ...MONO, fontSize: 7, color: 'rgba(255,255,255,0.28)', marginBottom: 5 }}>${creator.ticker}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: '#f5f5f5' }}>{score}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: isUp ? '#10b981' : '#ef4444' }}>{isUp ? '+' : ''}{delta}</span>
            </div>
            <div style={{ ...MONO, fontSize: 7, color: '#c9a84c', marginTop: 1 }}>{tier}</div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}

// ── Gem card (featured layout variant) ──────────────────────────────────────
function GemCard({ creator, onBuy, isSpotted = false }: { creator: Creator; onBuy: (c: Creator) => void; isSpotted?: boolean }) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isUp = delta >= 0

  return (
    <div className="glass-gold" style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          {creator.imageUrl ? (
            <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(201,168,76,0.3)', boxShadow: '0 0 18px rgba(201,168,76,0.14)', flexShrink: 0 }}>
              <img src={creator.imageUrl} alt={creator.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          ) : (
            <div
              className={cn('rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black', creator.coverColor)}
              style={{ width: 68, height: 68, border: '2px solid rgba(201,168,76,0.3)', flexShrink: 0, fontSize: 20 }}
            >
              {creator.avatar}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{creator.name}</div>
            <div style={{ ...MONO, fontSize: 7, color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>{creator.category}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {[
                { val: `${score}`, label: 'Score', color: '#f4d488', size: 18 },
                { val: `${isUp ? '+' : ''}${delta}`, label: 'Week', color: isUp ? '#10b981' : '#ef4444', size: 14 },
                { val: tier, label: 'Tier', color: 'rgba(255,255,255,0.55)', size: 11 },
              ].map(({ val, label, color, size }, idx) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {idx > 0 && <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.08)' }} />}
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: size, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ ...MONO, fontSize: 7, color: '#6b7280', marginTop: 1 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {creator.bio && (
          <p style={{ color: 'rgba(255,255,255,0.36)', fontSize: 12, lineHeight: 1.6, marginBottom: 12, margin: '0 0 12px' }}>
            {creator.bio.substring(0, 110)}…
          </p>
        )}
        <button
          onClick={() => onBuy(creator)}
          style={{
            width: '100%', height: 44, borderRadius: 12, marginTop: 12,
            ...(isSpotted
              ? { background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.28)', color: 'rgba(201,168,76,0.7)', cursor: 'default' }
              : { background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#0a0a0a', border: 'none', cursor: 'pointer' }),
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isSpotted ? '✓ You spotted this' : `💎 Spot ${creator.name.split(' ')[0]} first`}
        </button>
      </div>
    </div>
  )
}

// ── Personalized section ──────────────────────────────────────────────────────
function PersonalizedSection({
  section, onBuy, spottedTickers,
}: {
  section: HomeSection; onBuy: (c: Creator) => void; spottedTickers: string[]
}) {
  const sectionCreators = getCreatorsByTickers(section.tickers)
  if (sectionCreators.length === 0) return null
  const reasonLabel = section.reasonLabel ?? (section.reasonType ? reasonTypeLabel[section.reasonType] : undefined)

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.06 }}
      transition={spring}
      style={{ paddingTop: 20, paddingBottom: 8 }}
    >
      <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em', margin: 0 }}>{section.title}</h2>
          {section.subtitle && <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0 0' }}>{section.subtitle}</p>}
          {reasonLabel && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)', color: '#c9a84c', fontSize: 10, fontWeight: 600, marginTop: 7 }}>
              <Info size={9} /> {reasonLabel}
            </span>
          )}
        </div>
        <Link href="/explore" style={{ color: '#404040', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <ChevronRight size={16} />
        </Link>
      </div>

      {section.layout === 'horizontal' && (
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, paddingLeft: 20, paddingRight: 20, overflowX: 'auto' }}>
          {sectionCreators.map((c, i) => (
            <CreatorCard key={c.id} creator={c} onBuy={onBuy} delay={i * 0.05} isSpotted={spottedTickers.includes(c.ticker.toUpperCase())} />
          ))}
        </div>
      )}

      {section.layout === 'featured' && sectionCreators[0] && (
        <div style={{ padding: '0 20px' }}>
          <GemCard creator={sectionCreators[0]} onBuy={onBuy} isSpotted={spottedTickers.includes(sectionCreators[0].ticker.toUpperCase())} />
        </div>
      )}
    </motion.section>
  )
}

function SectionSkeleton() {
  return (
    <div style={{ padding: '20px 20px 8px' }}>
      <div className="animate-pulse" style={{ height: 17, width: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse" style={{ flexShrink: 0, width: 176, height: 264, background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CinematicHome() {
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
      const found = (creators as Creator[]).find(c => c.ticker.toUpperCase() === top.ticker.toUpperCase())
      if (found) return found
    }
    return trending[0]
  })()

  const posts = communityPosts.slice(0, 3)
  const activeTickers = spottedTickers
  const { score: featuredScore } = getMomentum(featured?.ticker ?? '')
  const { sections: homeSections, loading: sectionsLoading } = usePersonalizedFeed()

  if (momentumLoading) {
    return (
      <div style={{ padding: '28px 20px' }}>
        <div className="animate-pulse" style={{ height: 20, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 14 }} />
        <div className="animate-pulse" style={{ height: 410, background: 'rgba(255,255,255,0.04)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)' }} />
      </div>
    )
  }

  if (!featured) return null

  return (
    <>
      {/* 1 ── Featured artist (glass card, transparent bg) */}
      <FeaturedSection
        featured={featured}
        onBuy={handleBuy}
        isFeaturedSpotted={activeTickers.includes(featured.ticker.toUpperCase())}
      />

      <GoldDivider />

      {/* 2 ── Live momentum ticker */}
      <MomentumStrip list={trending} />

      <GoldDivider />

      {/* 3 ── Briefing header */}
      <motion.div
        initial={{ opacity: 0, x: -28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false }}
        transition={spring}
        style={{ padding: '22px 20px 6px', position: 'relative' }}
      >
        <WatermarkNum n="01" />
        <div style={{ ...MONO, color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>Your Daily Cultural Briefing</div>
        <h2 style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 22, letterSpacing: '-0.015em', margin: 0 }}>
          {currentUser ? `Good morning, ${currentUser.name.split(' ')[0]}.` : 'What to watch today.'}
        </h2>
      </motion.div>

      {/* 4 ── Personalised feed */}
      {sectionsLoading ? (
        <><SectionSkeleton /><SectionSkeleton /></>
      ) : homeSections.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>No recommendations yet</p>
          <p style={{ color: '#404040', fontSize: 12 }}>Spot some creators to personalise your feed</p>
        </div>
      ) : (
        homeSections.map((section, i) => (
          <div key={section.id}>
            <PersonalizedSection section={section} onBuy={handleBuy} spottedTickers={activeTickers} />
            <GoldDivider />
          </div>
        ))
      )}

      {/* 5 ── This Week in Culture */}
      <motion.section
        initial={{ opacity: 0, x: -28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.06 }}
        transition={spring}
        style={{ padding: '22px 20px 8px', position: 'relative' }}
      >
        <WatermarkNum n="02" />
        <div style={{ ...MONO, color: '#c9a84c', marginBottom: 14 }}>This Week in Culture</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 21, letterSpacing: '-0.01em', margin: '0 0 6px' }}>{featured.name}</h2>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{featured.bio?.split('.')[0]}.</p>
          </div>
          {featured.imageUrl && (
            <div className="glass" style={{ width: 58, height: 58, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
              <img src={featured.imageUrl} alt={featured.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Momentum', value: `${featuredScore}` },
            { label: 'Score', value: `${featured.creatorScore}/100` },
          ].map(({ label, value }) => (
            <div key={label} className="glass" style={{ borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ ...MONO, fontSize: 7, color: '#6b7280', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#f5f5f5', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>
        {activeTickers.includes(featured.ticker.toUpperCase()) ? (
          <div className="glass-gold" style={{ height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.8)', fontWeight: 700, fontSize: 13 }}>✦ Spotted</div>
        ) : (
          <motion.button
            onClick={() => handleBuy(featured)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            style={{ width: '100%', height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#0a0a0a', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,168,76,0.22)' }}
          >
            Spot {featured.name.split(' ')[0]} <ArrowRight size={14} />
          </motion.button>
        )}
      </motion.section>

      <GoldDivider />

      {/* 6 ── Culture Picks */}
      <motion.section
        initial={{ opacity: 0, x: 28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.06 }}
        transition={spring}
        style={{ paddingTop: 22, paddingBottom: 8, position: 'relative' }}
      >
        <WatermarkNum n="03" />
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em' }}>Culture Picks</div>
            <div style={{ ...MONO, fontSize: 7, color: '#6b7280', marginTop: 3 }}>Momentum · 24h</div>
          </div>
          <Link href="/explore" style={{ color: '#404040', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
            See all <ChevronRight size={12} />
          </Link>
        </div>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, paddingLeft: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {trending.map((c, i) => (
            <CreatorCard key={c.id} creator={c} onBuy={handleBuy} delay={i * 0.08} isSpotted={activeTickers.includes(c.ticker.toUpperCase())} />
          ))}
        </div>
      </motion.section>

      <GoldDivider />

      {/* 7 ── The Conversation */}
      <motion.section
        initial={{ opacity: 0, x: 28 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.06 }}
        transition={spring}
        style={{ padding: '22px 20px 124px', position: 'relative' }}
      >
        <WatermarkNum n="04" />
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em' }}>The Conversation</div>
          <div style={{ ...MONO, fontSize: 7, color: '#6b7280', marginTop: 3 }}>What the community is saying</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 18, x: i % 2 === 0 ? -14 : 14 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: false, amount: 0.08 }}
              transition={{ ...spring, delay: i * 0.07 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{ color: '#282828', fontSize: 10, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            SPOTLIGHT is a demonstration platform. Cultural Shares represent discovery participation, not equity ownership.
          </p>
        </div>
      </motion.section>

      {/* Modals */}
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
