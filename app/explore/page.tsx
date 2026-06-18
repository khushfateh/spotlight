'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Layers, TrendingUp, Gem, Zap, Star, Flame } from 'lucide-react'
import Link from 'next/link'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import {
  getCreatorsByCategory,
  getTrendingCreators,
  getTopGainers,
  getMomentum,
  getMomentumTier,
} from '@/lib/mock-data'
import { genres } from '@/lib/mock-data/genres'
import { getCreatorsInGenre } from '@/lib/mock-data/genres'
import { cn } from '@/lib/utils'
import { DiscoverStack } from '@/components/effects/DiscoverStack'
import { useDiscoverFeed } from '@/hooks/useDiscoverFeed'
import { useAuth } from '@/context/AuthContext'
import { useSpots } from '@/hooks/useSpots'
import { logCreatorSearch } from '@/lib/services/interactionService'
import type { Creator, CreatorCategory } from '@/types'

const ease = [0.16, 1, 0.3, 1] as const

// ── Discovery Lens ─────────────────────────────────────────────────────────────

type Lens = {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

const LENSES: Lens[] = [
  { id: 'trending',    label: 'Trending',      icon: <Flame size={14} />,     description: 'Highest momentum right now',     color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { id: 'rising',     label: 'Rising Fast',   icon: <TrendingUp size={14} />, description: 'Biggest score gains this week',   color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  { id: 'breakout',   label: 'Near Breakout', icon: <Zap size={14} />,        description: 'About to cross to next tier',     color: 'text-hype-gold border-hype-gold/30 bg-hype-gold/10' },
  { id: 'gems',       label: 'Hidden Gems',   icon: <Gem size={14} />,        description: 'Under the radar, accelerating',   color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  { id: 'editors',    label: "Editor's Picks", icon: <Star size={14} />,      description: 'Curated by the SPOTLIGHT team',   color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
]

// ── Creator list row ───────────────────────────────────────────────────────────

function CreatorListRow({ creator, rank, onBuy }: { creator: Creator; rank: number; onBuy: (c: Creator) => void }) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isDeltaUp = delta >= 0

  return (
    <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-hype-surface-2 transition-colors group">
        <span className="text-hype-dim text-[11px] font-mono w-5 flex-shrink-0 text-center">{rank}</span>

        {creator.imageUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <img src={creator.imageUrl} alt="" className="w-full h-full object-cover object-top" />
          </div>
        ) : (
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0', creator.coverColor)} />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-hype-text text-sm font-semibold truncate">{creator.name}</p>
          <p className="text-hype-muted text-[10px] font-mono">${creator.ticker} · {creator.category}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline justify-end gap-1.5">
            <p className="text-hype-text text-sm font-black tabular">{score}</p>
            <p className="text-hype-gold text-[8px] font-semibold uppercase tracking-wider">{tier}</p>
          </div>
          <p className={cn('text-[10px] font-semibold tabular', isDeltaUp ? 'text-hype-green' : 'text-hype-red')}>
            {isDeltaUp ? '+' : ''}{delta} pts
          </p>
        </div>

        <button
          onClick={e => { e.preventDefault(); onBuy(creator) }}
          className="flex-shrink-0 px-2.5 py-1.5 border border-hype-border text-hype-muted text-[10px] font-semibold rounded-lg hover:bg-hype-gold hover:text-[#0A0A0A] hover:border-hype-gold active:scale-95 transition-all"
        >
          Spot
        </button>
      </div>
    </Link>
  )
}

// ── Genre pill card ────────────────────────────────────────────────────────────

function GenreCard({ genre, onSelect }: { genre: typeof genres[0]; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(genre.id)}
      className="flex-shrink-0 relative rounded-2xl overflow-hidden text-left"
      style={{ width: 140, height: 100 }}
    >
      {genre.imageUrl ? (
        <img
          src={genre.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ transition: 'transform 0.4s ease' }}
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', genre.coverColor)} />
      )}
      {/* Gradient overlay: transparent top → dark bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        <span className="text-base leading-none">{genre.emoji}</span>
        <p className="text-white text-[11px] font-bold leading-tight mt-1">{genre.label}</p>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeLens, setActiveLens] = useState<string | null>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [discoverMode, setDiscoverMode] = useState(false)
  const [discoverCreators, setDiscoverCreators] = useState<Creator[]>([])
  const trade = useTradeSheet()

  function openDiscover() {
    const all = getCreatorsByCategory('All' as CreatorCategory)
    setDiscoverCreators([...all].sort((a, b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta))
    setDiscoverMode(true)
  }

  function handleGenreSelect(genreId: string) {
    setActiveGenre(activeGenre === genreId ? null : genreId)
    setActiveLens(null)
  }

  function handleLensSelect(lensId: string) {
    setActiveLens(activeLens === lensId ? null : lensId)
    setActiveGenre(null)
  }

  const { currentUser } = useAuth()
  const { spottedTickers } = useSpots()
  const allCreators = getCreatorsByCategory('All' as CreatorCategory)
  const gainers = getTopGainers(5)
  const { engineCreators, loading: engineLoading } = useDiscoverFeed(activeLens)

  // Log search interactions
  useEffect(() => {
    if (!query.trim()) return
    const t = setTimeout(() => {
      logCreatorSearch(currentUser?.id ?? null, query.trim())
    }, 800)
    return () => clearTimeout(t)
  }, [query, currentUser?.id])

  const filteredCreators = useMemo(() => {
    // Search and genre: always client-side
    if (query.trim()) {
      const q = query.toLowerCase()
      return allCreators.filter(c => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q))
    }
    if (activeGenre) {
      const tickers = getCreatorsInGenre(activeGenre)
      return allCreators.filter(c => tickers.includes(c.ticker))
    }
    // Lens: use engine results when available, fall back to static sort
    if (activeLens) {
      if (engineCreators.length > 0) return engineCreators
      // Fallback while loading
      switch (activeLens) {
        case 'trending':
          return [...allCreators].sort((a, b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
        case 'rising':
          return [...allCreators].sort((a, b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta).filter(c => getMomentum(c.ticker).delta > 0)
        case 'breakout':
          return [...allCreators].filter(c => { const s = getMomentum(c.ticker).score; return s >= 65 && s < 80 }).sort((a, b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
        case 'gems':
          return [...allCreators].filter(c => getMomentum(c.ticker).score < 70 && getMomentum(c.ticker).delta > 5).sort((a, b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
        case 'editors':
          return getTrendingCreators(8)
        default:
          return allCreators
      }
    }
    return [...allCreators].sort((a, b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
  }, [query, activeLens, activeGenre, allCreators, engineCreators])

  const activeLensData = LENSES.find(l => l.id === activeLens)
  const activeGenreData = genres.find(g => g.id === activeGenre)

  return (
    <>
      <div className="pb-32">

        {/* ── Search hero ───────────────────────────────────────────────── */}
        <div className="px-5 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3">
              Discovery Engine
            </p>
            <h1 className="text-white font-black text-4xl tracking-tight leading-none mb-6">
              Who&apos;s next?
            </h1>

            {/* Large search bar */}
            <div className="relative mb-4">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveLens(null); setActiveGenre(null) }}
                placeholder="Search creators, genres, tickers…"
                className="w-full bg-white/[0.07] border border-white/10 rounded-2xl pl-11 pr-11 py-4 text-white text-sm placeholder:text-white/25 outline-none focus:border-hype-gold/40 focus:bg-white/[0.09] transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Discover Mode button */}
            <button
              onClick={openDiscover}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs font-medium hover:border-white/20 hover:text-white/70 transition-all"
            >
              <Layers size={12} />
              Swipe Mode — discover by feel
            </button>
          </motion.div>
        </div>

        {/* ── Discovery Lenses ──────────────────────────────────────────── */}
        {!query && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <div className="px-5 mb-3">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                Discovery Lens
              </p>
            </div>
            <div className="flex gap-2 pl-5 overflow-x-auto hide-scrollbar pb-1" style={{ paddingRight: 20 }}>
              {LENSES.map(lens => (
                <button
                  key={lens.id}
                  onClick={() => handleLensSelect(lens.id)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all',
                    activeLens === lens.id ? lens.color : 'border-white/10 text-white/40 bg-white/[0.03] hover:border-white/20 hover:text-white/60',
                  )}
                >
                  {lens.icon}
                  {lens.label}
                </button>
              ))}
            </div>

            {/* Active lens description */}
            <AnimatePresence>
              {activeLensData && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 mt-2 text-white/35 text-xs"
                >
                  {activeLensData.description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ── Genre browsing grid ───────────────────────────────────────── */}
        {!query && !activeLens && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8"
          >
            <div className="px-5 mb-3 flex items-center justify-between">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                Browse by genre
              </p>
              {activeGenre && (
                <button onClick={() => setActiveGenre(null)} className="text-hype-gold text-[10px] font-medium hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2.5 pl-5 overflow-x-auto hide-scrollbar pb-2" style={{ paddingRight: 20 }}>
              {genres.map(genre => (
                <div key={genre.id} className={cn('transition-all', activeGenre === genre.id ? 'ring-2 ring-hype-gold rounded-2xl' : '')}>
                  <GenreCard genre={genre} onSelect={handleGenreSelect} />
                </div>
              ))}
            </div>
            {activeGenreData && (
              <p className="px-5 mt-2 text-white/35 text-xs">{activeGenreData.description}</p>
            )}
          </motion.section>
        )}

        {/* ── Near Breakout picks (when no filter active) ───────────────── */}
        {!query && !activeLens && !activeGenre && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="px-5 mb-4">
              <p className="text-hype-text font-black text-lg leading-none tracking-tight flex items-center gap-2">
                <Zap size={16} className="text-hype-gold" />
                Near Breakout
              </p>
              <p className="text-hype-muted text-xs mt-1">Approaching their next momentum tier</p>
            </div>
            <div className="flex gap-3 pl-5 overflow-x-auto hide-scrollbar pb-1" style={{ paddingRight: 20 }}>
              {gainers.slice(0, 5).map((c, i) => {
                const { score, delta } = getMomentum(c.ticker)
                const tier = getMomentumTier(score)
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: i * 0.05 }}
                    className="flex-shrink-0"
                    style={{ width: 130 }}
                  >
                    <Link href={`/creator/${c.ticker.toLowerCase()}`}>
                      <div className="relative rounded-2xl overflow-hidden" style={{ height: 190 }}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                        ) : (
                          <div className={cn('absolute inset-0 bg-gradient-to-br', c.coverColor)} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-hype-gold/20 text-hype-gold text-[8px] font-bold">
                            <TrendingUp size={7} /> +{delta}
                          </span>
                        </div>
                        <div className="absolute bottom-0 p-3">
                          <p className="text-white font-bold text-[12px] leading-tight">{c.name}</p>
                          <p className="text-white font-black text-sm tabular mt-0.5">{score}</p>
                          <p className="text-hype-gold text-[7px] font-bold uppercase tracking-wider">{tier}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ── Creator list: filtered or full ────────────────────────────── */}
        <section className="px-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-hype-text font-black text-lg leading-none tracking-tight">
                {query ? `Results for "${query}"` :
                  activeGenreData ? activeGenreData.label :
                  activeLensData ? activeLensData.label :
                  'All Creators'}
              </p>
              <p className="text-hype-muted text-xs mt-0.5 flex items-center gap-1.5">
                {activeLens && engineLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border border-hype-gold/40 border-t-hype-gold animate-spin" />
                  : null}
                {filteredCreators.length} creators
                {activeLens && engineCreators.length > 0 && (
                  <span className="text-hype-gold/60 text-[9px] font-medium">· engine ranked</span>
                )}
              </p>
            </div>
            {(activeLens || activeGenre) && (
              <button
                onClick={() => { setActiveLens(null); setActiveGenre(null) }}
                className="text-white/30 text-[10px] font-medium hover:text-white/50 flex items-center gap-1"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>

          {activeLens && engineLoading ? (
            <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border/60 animate-pulse">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-5 h-3 bg-white/5 rounded" />
                  <div className="w-10 h-10 rounded-xl bg-white/8 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-white/8 rounded" />
                    <div className="h-2.5 w-20 bg-white/5 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-4 w-10 bg-white/8 rounded" />
                    <div className="h-2.5 w-8 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCreators.length > 0 ? (
            <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border/60">
              {filteredCreators.map((c, i) => (
                <CreatorListRow key={c.id} creator={c} rank={i + 1} onBuy={trade.openBuy} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-white/50 font-semibold mb-2">No creators found</p>
              <button onClick={() => { setQuery(''); setActiveLens(null); setActiveGenre(null) }} className="text-hype-gold text-sm font-medium hover:underline">
                Reset filters
              </button>
            </div>
          )}
        </section>

        <div className="text-center mt-10 px-5">
          <p className="text-hype-dim text-[10px]">Mock data only · Not financial advice</p>
        </div>
      </div>

      {/* Discover Stack */}
      <AnimatePresence>
        {discoverMode && (
          <DiscoverStack
            creators={discoverCreators}
            onBuy={trade.openBuy}
            onClose={() => setDiscoverMode(false)}
            spottedTickers={spottedTickers}
          />
        )}
      </AnimatePresence>

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
    </>
  )
}
