'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, ChevronRight, Layers } from 'lucide-react'
import Link from 'next/link'
import PriceChart from '@/components/market/PriceChart'
import TradeSheet from '@/components/trading/TradeSheet'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import {
  getCreatorsByCategory,
  getTrendingCreators,
  getTopGainers,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data'
import { fadeUp, reveal, sectionReveal, ease } from '@/lib/motion'
import { DiscoverStack } from '@/components/effects/DiscoverStack'
import type { Creator, CreatorCategory } from '@/types'

// ── Editorial sections ────────────────────────────────────────────────────────

// Horizontal portrait card — compact, editorial
function MiniPortraitCard({
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
  const isDeltaUp = delta >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease, delay }}
      className="flex-shrink-0 group cursor-pointer"
      style={{ width: 140 }}
    >
      <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
          {creator.imageUrl ? (
            <img
              src={creator.imageUrl}
              alt={creator.name}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
          <button
            onClick={e => { e.preventDefault(); onBuy(creator) }}
            className="absolute top-2 right-2 px-2 py-0.5 bg-hype-gold text-[#0A0A0A] text-[9px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Spot
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-bold text-[13px] leading-tight">{creator.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-white/80 text-sm font-black tabular">{score}</p>
              <p className="text-hype-gold text-[8px] font-semibold uppercase tracking-wider">{tier}</p>
            </div>
            <p className={cn('text-[10px] font-semibold tabular mt-0.5', isDeltaUp ? 'text-hype-green' : 'text-hype-red')}>
              {isDeltaUp ? '+' : ''}{delta} pts
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// List row — for the full creator list below the fold
function CreatorListRow({
  creator,
  rank,
  onBuy,
}: {
  creator: Creator
  rank: number
  onBuy: (c: Creator) => void
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isDeltaUp = delta >= 0

  return (
    <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-hype-surface-2 transition-colors group">
        <span className="text-hype-dim text-[11px] font-mono w-4 flex-shrink-0">{rank}</span>

        {creator.imageUrl ? (
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
            <img src={creator.imageUrl} alt="" className="w-full h-full object-cover object-top" />
          </div>
        ) : (
          <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex-shrink-0', creator.coverColor)} />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-hype-text text-sm font-semibold truncate">{creator.name}</p>
          <p className="text-hype-muted text-[10px] font-mono">${creator.ticker} · {creator.category}</p>
        </div>

        <div className="text-right flex-shrink-0 w-20">
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
          className="flex-shrink-0 px-2.5 py-1.5 bg-hype-gold/0 border border-hype-border text-hype-muted text-[10px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 group-hover:bg-hype-gold group-hover:text-[#0A0A0A] group-hover:border-hype-gold transition-all"
        >
          Spot
        </button>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const categories = ['All', 'Music', 'Gaming', 'Content', 'Sports', 'Lifestyle'] as const
type CategoryFilter = typeof categories[number]

const sortOptions = ['Trending', 'Rising', 'Cooling', 'Reach'] as const
type SortOption = typeof sortOptions[number]

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [sort, setSort] = useState<SortOption>('Trending')
  const [searchOpen, setSearchOpen] = useState(false)
  const [discoverMode, setDiscoverMode] = useState(false)
  const [discoverCreators, setDiscoverCreators] = useState<Creator[]>([])
  const trade = useTradeSheet()

  function openDiscover() {
    const all = getCreatorsByCategory('All' as CreatorCategory)
    const shuffled = [...all].sort(() => Math.random() - 0.5)
    setDiscoverCreators(shuffled)
    setDiscoverMode(true)
  }

  const trending = getTrendingCreators(8)
  const gainers = getTopGainers(5)
  const featuredStory = trending[0]

  const allCreators = useMemo(() => {
    let list = getCreatorsByCategory(category === 'All' ? 'All' : (category as CreatorCategory))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'Rising': return [...list].sort((a, b) => (getMomentum(b.ticker).delta) - (getMomentum(a.ticker).delta))
      case 'Cooling': return [...list].sort((a, b) => (getMomentum(a.ticker).delta) - (getMomentum(b.ticker).delta))
      case 'Reach': return [...list].sort((a, b) => b.marketCap - a.marketCap)
      default: return [...list].sort((a, b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
    }
  }, [query, category, sort])

  return (
    <>
      <div className="pb-32">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="px-5 pt-8 pb-6">
          <motion.p {...fadeUp(0)} className="section-label text-hype-gold mb-3">
            Spotlight Daily
          </motion.p>
          <motion.h1 {...fadeUp(0.07)} className="page-headline text-hype-text mb-2">
            DISCOVER
          </motion.h1>
          <motion.p {...fadeUp(0.13)} className="text-hype-muted text-sm mb-5">
            Culture moves fast. We move faster.
          </motion.p>
          <motion.div {...fadeUp(0.18)}>
            <button
              onClick={openDiscover}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-hype-gold/10 border border-hype-gold/30 text-hype-gold text-xs font-bold hover:bg-hype-gold/15 transition-colors"
            >
              <Layers size={13} />
              Discover Mode — swipe to back
            </button>
          </motion.div>
        </div>

        {/* ── Today's Feature — editorial spotlight ─────────────────────── */}
        {featuredStory && (
          <motion.section {...reveal(0.1)} className="px-5 mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-1 rounded-full bg-hype-gold" />
              <span className="section-label text-hype-gold">Today&apos;s Feature</span>
            </div>
            <Link href={`/creator/${featuredStory.ticker.toLowerCase()}`}>
              <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 280 }}>
                {featuredStory.imageUrl ? (
                  <img
                    src={featuredStory.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className={cn('absolute inset-0 bg-gradient-to-br', featuredStory.coverColor)} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white/50 text-[9px] tracking-widest uppercase mb-2">
                    {featuredStory.category} · #{featuredStory.ticker}
                  </p>
                  <h2 className="text-white font-black text-3xl tracking-tight leading-tight mb-2">
                    {featuredStory.name}
                  </h2>
                  {featuredStory.story && (
                    <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-[260px]">
                      {featuredStory.story}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={e => { e.preventDefault(); trade.openBuy(featuredStory) }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[12px] hover:bg-hype-gold-dim transition-colors"
                    >
                      Spot {featuredStory.name.split(' ')[0]} <ArrowRight size={12} />
                    </button>
                    <div className="text-right">
                      <p className="text-white font-black text-xl tabular">
                        {getMomentum(featuredStory.ticker).score}
                      </p>
                      <p className="text-hype-gold text-xs font-bold uppercase tracking-wider">
                        {getMomentumTier(getMomentum(featuredStory.ticker).score)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* ── Breaking Out ──────────────────────────────────────────────── */}
        <motion.section {...sectionReveal} className="mb-10">
          <div className="px-5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-hype-text font-black text-xl leading-none tracking-tight">Breaking Out</p>
              <p className="text-hype-muted text-xs mt-1">Biggest moves in 24h</p>
            </div>
            <ChevronRight size={16} className="text-hype-dim" />
          </div>
          <div className="flex gap-3 pl-5 overflow-x-auto hide-scrollbar pb-1" style={{ paddingRight: 20 }}>
            {trending.slice(0, 5).map((c, i) => (
              <MiniPortraitCard key={c.id} creator={c} onBuy={trade.openBuy} delay={i * 0.05} />
            ))}
          </div>
        </motion.section>

        {/* ── Before They Blow Up ───────────────────────────────────────── */}
        <motion.section {...sectionReveal} className="mb-10">
          <div className="px-5 mb-5">
            <p className="text-hype-text font-black text-xl leading-none tracking-tight">
              Before They Blow Up
            </p>
            <p className="text-hype-muted text-xs mt-1">Early stage, high potential</p>
          </div>
          <div className="flex gap-3 pl-5 overflow-x-auto hide-scrollbar pb-1" style={{ paddingRight: 20 }}>
            {gainers.slice(0, 5).map((c, i) => (
              <MiniPortraitCard key={c.id} creator={c} onBuy={trade.openBuy} delay={i * 0.05} />
            ))}
          </div>
        </motion.section>

        {/* ── All Creators / Search ─────────────────────────────────────── */}
        <motion.section {...sectionReveal} className="px-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-hype-text font-black text-xl leading-none tracking-tight">All Creators</p>
              <p className="text-hype-muted text-xs mt-1">{allCreators.length} on the market</p>
            </div>
            <button
              onClick={() => setSearchOpen(s => !s)}
              className="w-8 h-8 rounded-full border border-hype-border flex items-center justify-center text-hype-muted hover:text-hype-secondary transition-colors"
            >
              {searchOpen ? <X size={14} /> : <Search size={14} />}
            </button>
          </div>

          {/* Search bar — only shows when toggled */}
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-4"
            >
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-hype-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search creators..."
                  autoFocus
                  className="w-full bg-hype-surface border border-hype-border rounded-2xl pl-9 pr-4 py-3 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* Category + sort */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
                  category === cat
                    ? 'bg-hype-surface-2 text-hype-text border border-hype-border-light'
                    : 'text-hype-muted border border-hype-border hover:text-hype-secondary',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-1 mb-4">
            {sortOptions.map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all',
                  sort === s
                    ? 'bg-hype-surface-2 text-hype-text border border-hype-border'
                    : 'text-hype-muted hover:text-hype-secondary',
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Creator list */}
          {allCreators.length > 0 ? (
            <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border/60">
              {allCreators.map((c, i) => (
                <CreatorListRow key={c.id} creator={c} rank={i + 1} onBuy={trade.openBuy} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-hype-text font-semibold mb-1">No creators found</p>
              <button
                onClick={() => { setQuery(''); setCategory('All') }}
                className="text-hype-gold text-sm font-medium hover:underline mt-1"
              >
                Clear filters
              </button>
            </div>
          )}
        </motion.section>

        <div className="text-center mt-10 px-5">
          <p className="text-hype-dim text-[10px]">Mock data only · Not financial advice</p>
        </div>
      </div>

      <AnimatePresence>
        {discoverMode && (
          <DiscoverStack
            creators={discoverCreators}
            onBuy={trade.openBuy}
            onClose={() => setDiscoverMode(false)}
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
        onSubmitOrder={trade.submitOrder}
        onConfirmOrder={trade.confirmOrder}
        onReset={trade.reset}
      />
    </>
  )
}
