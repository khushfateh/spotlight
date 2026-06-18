'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Vault } from 'lucide-react'
import Link from 'next/link'
import MoveOnCinematic from '@/components/trading/MoveOnCinematic'
import VaultOpeningCinematic from '@/components/trading/VaultOpeningCinematic'
import { useVault, type VaultEntry } from '@/hooks/useVault'
import { useSpots } from '@/hooks/useSpots'
import { useAuth } from '@/context/AuthContext'
import { getCreatorByTicker } from '@/lib/mock-data/creators'
import type { Creator } from '@/types'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { getSpotterRank } from '@/lib/mock-data/spots'
import { transactions } from '@/lib/mock-data'
import { formatTimeAgo, cn } from '@/lib/utils'
import { fadeUp, sectionReveal, ease, countDuration, countEase } from '@/lib/motion'

function daysAgoFromDate(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

const narratives: Record<string, string> = {
  APDHILLON: 'spotted before his North American tour sold out.',
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

// ── Holding card ──────────────────────────────────────────────────────────────

function PortfolioHoldingCard({
  entry,
  onMoveOn,
  onOpenVault,
  delay,
}: {
  entry: VaultEntry
  onMoveOn?: () => void
  onOpenVault?: () => void
  delay?: number
}) {
  const creator = getCreatorByTicker(entry.ticker)
  const narrative = narratives[entry.ticker]
  const momentumGain = entry.currentScore - entry.momentumAtSpot
  const isGain = momentumGain >= 0
  const isWeeklyUp = entry.currentDelta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: delay ?? 0 }}
      className="premium-card rounded-3xl overflow-hidden"
    >
      <Link href={`/creator/${entry.ticker.toLowerCase()}`}>
        {creator?.imageUrl ? (
          <div className="relative h-20 overflow-hidden">
            <img src={creator.imageUrl} alt="" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-r from-hype-surface via-hype-surface/60 to-transparent" />
            <div className="absolute inset-y-0 left-0 px-4 flex flex-col justify-center">
              <p className="text-hype-text font-black text-lg tracking-tight leading-tight">
                {creator.name}
              </p>
              <p className="text-white/50 text-[10px] font-mono tracking-widest mt-0.5">
                ${entry.ticker}
              </p>
            </div>
          </div>
        ) : (
          <div className={cn('h-16 bg-gradient-to-br relative', creator?.coverColor ?? 'from-hype-purple to-hype-indigo')}>
            <div className="absolute inset-0 bg-gradient-to-r from-hype-surface to-transparent" />
            <div className="absolute inset-0 px-4 flex items-center">
              <p className="text-hype-text font-black text-lg tracking-tight">
                {creator?.name ?? entry.ticker}
              </p>
            </div>
          </div>
        )}
      </Link>

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-dim text-[10px]">
            Spotted{' '}
            <span className="text-hype-muted font-semibold">{daysAgoFromDate(entry.spotDate)} days ago</span>
            {' · '}Spotter{' '}
            <span className="text-hype-gold font-bold">#{entry.spotterRank}</span>
          </p>
          {momentumGain >= 28 && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{
                color: 'rgba(201,168,76,0.85)',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.18)',
                letterSpacing: '0.12em',
              }}
            >
              ✦ Breakout
            </span>
          )}
        </div>

        {narrative && (
          <p className="text-hype-secondary text-sm leading-relaxed mb-3">
            <span className="text-hype-text font-medium">You </span>
            {narrative}
          </p>
        )}

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-hype-text font-black text-2xl tabular tracking-tight leading-none">
              {entry.currentScore}
            </p>
            <p className="text-hype-gold text-[10px] font-bold uppercase tracking-wider mt-0.5">
              {entry.currentTier}
            </p>
          </div>
          <div className="text-right">
            <p className={cn('font-black text-xl tabular tracking-tight', isGain ? 'text-hype-green' : 'text-hype-red')}>
              {isGain ? '+' : ''}{momentumGain} pts
            </p>
            <p className="text-hype-muted text-[10px] mt-0.5">
              spotted at {entry.momentumAtSpot}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-hype-dim mb-3">
          <span>
            this week{' '}
            <span className={cn('font-semibold tabular', isWeeklyUp ? 'text-hype-green' : 'text-hype-red')}>
              {isWeeklyUp ? '+' : ''}{entry.currentDelta} pts
            </span>
          </span>
          <span className="text-hype-muted">momentum score</span>
        </div>

        <div className={cn('flex gap-2', onMoveOn ? '' : '')}>
          {onOpenVault && (
            <button
              onClick={onOpenVault}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'rgba(201,168,76,0.07)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: 'rgba(201,168,76,0.75)',
              }}
            >
              ✦ Vault Card
            </button>
          )}
          {onMoveOn && (
            <button
              onClick={onMoveOn}
              className={cn(
                'py-2.5 rounded-xl text-xs font-semibold text-hype-muted bg-transparent border border-hype-border hover:border-hype-border-light hover:text-hype-secondary transition-colors',
                onOpenVault ? 'flex-1' : 'w-full',
              )}
            >
              Move On
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Vault Archived Card ───────────────────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function VaultArchivedCard({
  entry,
  onOpen,
  delay,
}: {
  entry: VaultEntry
  onOpen: () => void
  delay?: number
}) {
  const creator = getCreatorByTicker(entry.ticker)
  const gain = entry.currentScore - entry.momentumAtSpot
  const isBreakout = gain >= 28
  const days = entry.spotDurationDays ??
    Math.max(1, Math.floor((Date.now() - entry.spotDate.getTime()) / 86400000))
  const chapters = (entry.rediscoveryCount ?? 0) + 1
  const movedOnAt = entry.archivedAt ?? new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: delay ?? 0 }}
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: 'rgba(10,9,12,0.85)',
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 0 28px rgba(201,168,76,0.06)',
      }}
    >
      {/* Creator image strip */}
      <div className="relative h-16 overflow-hidden">
        {creator?.imageUrl ? (
          <>
            <img
              src={creator.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: 'blur(4px) brightness(0.18) saturate(0.3)' }}
            />
            <img
              src={creator.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0.22) saturate(0.35)' }}
            />
          </>
        ) : (
          <div
            className={cn('absolute inset-0 bg-gradient-to-br', creator?.coverColor ?? 'from-hype-purple to-hype-indigo')}
            style={{ filter: 'brightness(0.18) saturate(0.35)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a090c] via-[#0a090c]/70 to-transparent" />
        <div className="absolute inset-0 px-4 flex flex-col justify-center">
          <p className="text-white font-black text-base tracking-tight leading-tight" style={{ opacity: 0.7 }}>
            {creator?.name ?? entry.ticker}
          </p>
          <p className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: 'rgba(201,168,76,0.45)' }}>
            ${entry.ticker}
          </p>
        </div>
        {/* Chapters badge */}
        {chapters > 1 && (
          <div className="absolute top-2 right-3">
            <span
              className="text-[8px] font-bold tracking-wider"
              style={{ color: 'rgba(200,210,225,0.65)' }}
            >
              Ch. {ROMAN[Math.min(chapters - 1, ROMAN.length - 1)]}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'SPOTTER', value: `#${entry.spotterRank}`, gold: true, green: false },
            { label: 'DURATION', value: `${days}d`, gold: false, green: false },
            {
              label: 'GAIN',
              value: `${gain >= 0 ? '+' : ''}${gain}${isBreakout ? ' ✦' : ''}`,
              gold: isBreakout,
              green: !isBreakout && gain > 0,
            },
          ].map(({ label, value, gold, green }) => (
            <div key={label}>
              <p className="text-[8px] font-bold tracking-widest mb-0.5 uppercase"
                style={{ color: 'rgba(255,255,255,0.16)' }}>
                {label}
              </p>
              <p
                className="text-sm font-black tabular"
                style={{
                  color: gold
                    ? 'rgba(201,168,76,0.85)'
                    : green
                      ? '#4CAF50'
                      : 'rgba(255,255,255,0.55)',
                  textShadow: gold ? '0 0 10px rgba(201,168,76,0.25)' : 'none',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}>
          <span>
            Spotted {entry.spotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span>
            Moved on {movedOnAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <button
          onClick={onOpen}
          className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
          style={{
            background: 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.28)',
            color: 'rgba(201,168,76,0.75)',
            letterSpacing: '0.12em',
          }}
        >
          ✦ Open Vault
        </button>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'Spotted' | 'Vault' | 'Activity'

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Spotted')
  const [movingOn, setMovingOn] = useState<{ entry: VaultEntry; creator: NonNullable<ReturnType<typeof getCreatorByTicker>> } | null>(null)
  const [vaultOpen, setVaultOpen] = useState<{ entry: VaultEntry; creator: Creator } | null>(null)
  const { entries: vaultEntries, loading: vaultLoading } = useVault()
  const { spottedTickers, loading: spotsLoading, moveOn } = useSpots()
  const { isSupabaseMode } = useAuth()

  // In Supabase mode, archived entries are real moved-on cards.
  // In mock mode, show all vault entries so the tab isn't empty.
  const archivedEntries = isSupabaseMode
    ? vaultEntries.filter(e => e.isArchived)
    : vaultEntries

  // Source of truth for WHAT to show is useSpots (spots table).
  // Enrich each ticker with vault metadata if available; fall back to computed defaults
  // for spots that pre-date the discovery_cards table.
  const visibleEntries: VaultEntry[] = isSupabaseMode
    ? spottedTickers.map(ticker => {
        const upper = ticker.toUpperCase()
        const vault = vaultEntries.find(e => e.ticker === upper)
        if (vault) return vault
        const { score, delta } = getMomentum(upper)
        return {
          ticker: upper,
          spotterRank: getSpotterRank(upper),
          momentumAtSpot: score,
          spotDate: new Date(),
          currentScore: score,
          currentDelta: delta,
          currentTier: getMomentumTier(score),
          isArchived: false,
          archivedAt: null,
          spotDurationDays: null,
          rediscoveryCount: 0,
          latestRespottedAt: null,
          firstMovedOnAt: null,
        }
      })
    : vaultEntries  // mock mode: useVault already returns mock holdings

  const loading = isSupabaseMode ? spotsLoading : vaultLoading

  const avgMomentum = visibleEntries.length
    ? Math.round(visibleEntries.reduce((sum, e) => sum + e.currentScore, 0) / visibleEntries.length)
    : 0

  return (
    <>
      <div className="px-4 pb-32">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="pt-8 pb-6">
          <motion.p
            {...fadeUp(0)}
            className="uppercase mb-3"
            style={{ fontSize: 9, letterSpacing: '0.35em', color: 'rgba(201,168,76,0.55)', fontWeight: 600 }}
          >
            Discovery Vault
          </motion.p>
          <motion.div {...fadeUp(0.08)} className="flex items-end gap-3">
            <AnimatedValue to={visibleEntries.length} className="number-display text-hype-text" />
            <span className="text-hype-muted text-base pb-2 font-medium">creators spotted</span>
          </motion.div>
          {avgMomentum > 0 && (
            <motion.div {...fadeUp(0.14)} className="flex items-center gap-2 mt-2">
              <span className="text-hype-gold text-sm font-bold tabular">{avgMomentum}</span>
              <span className="text-hype-muted text-xs">avg momentum · {getMomentumTier(avgMomentum)}</span>
            </motion.div>
          )}
        </div>

        <motion.p {...fadeUp(0.18)} className="text-hype-muted text-sm mb-6">
          A record of every creator you discovered{' '}
          <span className="text-hype-text font-semibold">before the world caught on.</span>
        </motion.p>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.22)} className="flex gap-4 border-b border-hype-border/60 mb-6">
          {(['Spotted', 'Vault', 'Activity'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-semibold transition-colors relative',
                activeTab === tab ? 'text-hype-text' : 'text-hype-muted hover:text-hype-secondary',
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
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
              </div>
            ) : visibleEntries.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-hype-text font-semibold mb-1">No spots yet</p>
                <p className="text-hype-secondary text-sm mb-4">Spot a creator to start your vault</p>
                <Link href="/explore">
                  <button className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm">
                    Explore Creators <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {visibleEntries.map((entry, i) => {
                  const creator = getCreatorByTicker(entry.ticker)
                  return (
                    <PortfolioHoldingCard
                      key={entry.ticker}
                      entry={entry}
                      onMoveOn={creator ? () => setMovingOn({ entry, creator }) : undefined}
                      onOpenVault={creator ? () => setVaultOpen({ entry, creator }) : undefined}
                      delay={i * 0.08}
                    />
                  )
                })}
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
              </>
            )}
          </div>
        )}

        {/* ── Vault ─────────────────────────────────────────────────────── */}
        {activeTab === 'Vault' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {vaultLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
              </div>
            ) : archivedEntries.length === 0 ? (
              <div className="py-16 text-center">
                <Vault size={28} className="mx-auto mb-3" style={{ color: 'rgba(201,168,76,0.35)' }} />
                <p className="text-hype-text font-semibold mb-1">Vault is empty</p>
                <p className="text-hype-secondary text-sm">
                  When you Move On from a creator, they&apos;re archived here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-hype-muted text-xs uppercase tracking-widest mb-1"
                  style={{ letterSpacing: '0.2em', color: 'rgba(201,168,76,0.4)' }}>
                  {archivedEntries.length} archived {archivedEntries.length === 1 ? 'discovery' : 'discoveries'}
                </p>
                {archivedEntries.map((entry, i) => {
                  const creator = getCreatorByTicker(entry.ticker)
                  if (!creator) return null
                  return (
                    <VaultArchivedCard
                      key={entry.ticker}
                      entry={entry}
                      onOpen={() => setVaultOpen({ entry, creator })}
                      delay={i * 0.08}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
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
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', tx.type === 'buy' ? 'bg-hype-green' : 'bg-hype-muted')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-hype-text text-sm font-semibold">
                      {tx.type === 'buy' ? 'Spotted' : 'Moved On'}{' '}
                      <span className="font-mono text-hype-secondary">${tx.ticker}</span>
                    </p>
                    <p className="text-hype-muted text-xs mt-0.5">{formatTimeAgo(tx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs font-semibold uppercase tracking-wide', tx.type === 'buy' ? 'text-hype-green' : 'text-hype-muted')}>
                      {tx.type === 'buy' ? '+ Spotted' : '− Moved On'}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        <div className="text-center mt-10">
          <p className="text-hype-dim text-[10px]">Your discovery record · Not financial advice</p>
        </div>
      </div>

      {movingOn && (
        <MoveOnCinematic
          creator={movingOn.creator}
          entry={movingOn.entry}
          onMoveOn={(days) => moveOn(movingOn.entry.ticker, days)}
          onDone={() => setMovingOn(null)}
        />
      )}

      {vaultOpen && (
        <VaultOpeningCinematic
          creator={vaultOpen.creator}
          entry={vaultOpen.entry}
          onClose={() => setVaultOpen(null)}
        />
      )}
    </>
  )
}
