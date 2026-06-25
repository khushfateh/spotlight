'use client'

import { useState, useEffect } from 'react'
import { Settings, ChevronRight, Star, LogOut, Bell, Shield, HelpCircle, Zap, Compass, Trophy, Target, Clock, Award, X, Search, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '@/context/UserContext'
import { useAuth } from '@/context/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useSpots } from '@/hooks/useSpots'
import { useSpotCollection } from '@/hooks/useSpotCollection'
import { useGenres } from '@/hooks/useGenres'
import { Badge } from '@/components/ui/Badge'
import { getMomentum, getMomentumTier } from '@/lib/mock-data'
import { genres as mockGenres } from '@/lib/mock-data/genres'
import { getCreatorByTicker } from '@/lib/mock-data/creators'
import { holdings } from '@/lib/mock-data'
import GoldDiscoveryCard from '@/components/trading/GoldDiscoveryCard'
import { SpotterCard } from '@/components/trading/SpotterCard'
import VaultOpeningCinematic from '@/components/trading/VaultOpeningCinematic'
import { useVault, type VaultEntry } from '@/hooks/useVault'
import type { Creator } from '@/types'

function getDiscoveryStatus(holdingCount: number, avgMomentum: number) {
  if (avgMomentum >= 80 && holdingCount >= 4) {
    return { label: 'Top Discoverer', icon: Trophy, color: 'text-hype-gold', bg: 'bg-hype-gold/10 border-hype-gold/30', desc: 'Found rising talent before anyone else.' }
  }
  if (avgMomentum >= 65 || holdingCount >= 3) {
    return { label: 'Culture Scout', icon: Compass, color: 'text-hype-indigo', bg: 'bg-hype-indigo/10 border-hype-indigo/30', desc: 'Identifying cultural momentum early.' }
  }
  return { label: 'Early Spotter', icon: Zap, color: 'text-hype-green', bg: 'bg-hype-green/10 border-hype-green/30', desc: 'Spotting creators before the world catches on.' }
}

const BADGE_ICONS: Record<string, string> = {
  'First 100': '🥇',
  'First 50': '🥈',
  'First 10': '🏅',
  'OG Spotter': '⭐',
  'Trending Caller': '📈',
  'Hidden Gem Hunter': '💎',
}

// ── Genre manager bottom sheet ────────────────────────────────────────────────
function GenreManagerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { genreSlugs, saveGenres, loading } = useUserPreferences()
  const { genres: supabaseGenres, byCategory, loading: genresLoading } = useGenres()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>(genreSlugs)
  const [saving, setSaving] = useState(false)

  // Sync sheet selection whenever it opens (genreSlugs may load async in Supabase mode)
  useEffect(() => {
    if (open) setSelected(genreSlugs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const allGenres = supabaseGenres.length > 0
    ? supabaseGenres
    : mockGenres.map(g => ({ id: g.id, slug: g.id, name: g.label, category: 'Genre', description: g.description, created_at: '' }))

  const categories = supabaseGenres.length > 0 ? Object.keys(byCategory) : ['Genre']
  const filtered = query.trim()
    ? allGenres.filter(g => g.name.toLowerCase().includes(query.toLowerCase()))
    : allGenres

  function toggle(slug: string) {
    setSelected(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])
  }

  async function handleSave() {
    setSaving(true)
    await saveGenres(selected)
    setSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 rounded-t-3xl z-[51] flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <div>
                <p className="text-white font-bold text-base">Taste Profile</p>
                <p className="text-white/40 text-xs">{selected.length} genres selected</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search genres…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-hype-gold/40 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {genresLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
                </div>
              ) : query.trim() ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {filtered.map(genre => {
                    const sel = selected.includes(genre.slug)
                    return (
                      <button key={genre.id} onClick={() => toggle(genre.slug)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${sel ? 'border-hype-gold bg-hype-gold/15 text-hype-gold' : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'}`}>
                        {sel && <Check size={10} className="inline mr-1" />}{genre.name}
                      </button>
                    )
                  })}
                  {filtered.length === 0 && <p className="text-white/30 text-sm py-4">No genres match &quot;{query}&quot;</p>}
                </div>
              ) : (
                <div className="space-y-5 pt-2">
                  {categories.map(cat => {
                    const catGenres = supabaseGenres.length > 0
                      ? (byCategory[cat] ?? [])
                      : mockGenres.map(g => ({ id: g.id, slug: g.id, name: g.label, category: 'Genre', description: g.description, created_at: '' }))
                    if (!catGenres.length) return null
                    return (
                      <div key={cat}>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">{cat}</p>
                        <div className="flex flex-wrap gap-2">
                          {catGenres.map(genre => {
                            const sel = selected.includes(genre.slug)
                            return (
                              <button key={genre.id} onClick={() => toggle(genre.slug)}
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${sel ? 'border-hype-gold bg-hype-gold/15 text-hype-gold' : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'}`}>
                                {sel && <Check size={10} className="inline mr-1" />}{genre.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-white/8">
              <button onClick={handleSave} disabled={saving || loading}
                className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] animate-spin" /> : 'Save taste profile'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main profile page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, userMode, setUserMode } = useUser()
  const { currentUser, logout, isSupabaseMode } = useAuth()
  const { genreSlugs, saveGenres } = useUserPreferences()
  const { spottedTickers, loading: spotsLoading } = useSpots()
  const { collection, loading: collectionLoading } = useSpotCollection()
  const { entries: vaultItems, loading: vaultLoading } = useVault()
  const [genreSheetOpen, setGenreSheetOpen] = useState(false)
  const [vaultOpen, setVaultOpen] = useState<{ entry: VaultEntry; creator: Creator } | null>(null)

  // In Supabase mode, use real spotted tickers; in mock mode, use holdings
  const mockSpottedTickers = holdings.map(h => h.ticker)
  const activeSpottedTickers = isSupabaseMode ? spottedTickers : mockSpottedTickers
  const creatorsSpottedCount = activeSpottedTickers.length || (currentUser?.creatorsSpotted ?? 0)

  const avgMomentum = vaultItems.length
    ? Math.round(vaultItems.reduce((sum, e) => sum + e.currentScore, 0) / vaultItems.length)
    : 0

  const status = getDiscoveryStatus(activeSpottedTickers.length, avgMomentum)
  const StatusIcon = status.icon

  const discoveryScore = currentUser?.discoveryScore ?? 0
  const breakoutsIdentified = currentUser?.breakoutsIdentified ?? 0
  const avgLeadDays = currentUser?.avgLeadDays ?? 0
  const momentumAccuracy = currentUser?.momentumAccuracy ?? 0
  const discoveryRank = currentUser?.discoveryRank ?? status.label
  const badges = currentUser?.badges ?? []

  const displayedGenres = genreSlugs.map(slug => {
    const mock = mockGenres.find(g => g.id === slug)
    return mock ? { slug, label: mock.label, emoji: mock.emoji } : { slug, label: slug, emoji: '🎵' }
  })

  // Resolve creator data for spotted tickers
  const spottedCreators = activeSpottedTickers
    .map(ticker => getCreatorByTicker(ticker))
    .filter(Boolean)

  // Vault entries — only show creators the user is currently spotting
  const activeTickerSet = new Set(activeSpottedTickers.map(t => t.toUpperCase()))
  const vaultEntries = vaultItems
    .filter(e => activeTickerSet.has(e.ticker.toUpperCase()))
    .map(e => {
      const creator = getCreatorByTicker(e.ticker)
      if (!creator) return null
      return { creator, spotterRank: e.spotterRank, spotDate: e.spotDate, score: e.currentScore, tier: e.currentTier }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const vaultUserName = (currentUser?.name ?? user.name).split(' ')[0] || 'You'

  return (
    <div className="px-4 pt-4 pb-28 space-y-5">

      {/* Profile Card */}
      <div className="elevated-card glass rounded-3xl p-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-start gap-4">
          {currentUser ? (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentUser.coverColor} flex items-center justify-center text-white text-xl font-black`} style={{ boxShadow: '0 0 20px rgba(107,33,168,0.3)' }}>
              {currentUser.initials}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold" style={{ boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
              {user.avatar}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-hype-text font-bold text-lg font-display">{user.name}</h2>
              <Badge variant="gold" size="sm">Pro</Badge>
            </div>
            <p className="text-hype-muted text-xs font-mono mb-1">{user.username}</p>
            <p className="text-hype-secondary text-xs leading-relaxed">{user.bio || 'Cultural discoverer.'}</p>
          </div>
        </div>

        <div className={`mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${status.bg}`}>
          <StatusIcon size={16} className={status.color} />
          <div className="flex-1">
            <p className={`text-xs font-bold ${status.color}`}>{discoveryRank}</p>
            <p className="text-hype-muted text-[10px]">{status.desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-hype-border">
          <div className="text-center">
            <p className="text-hype-text font-bold">{creatorsSpottedCount}</p>
            <p className="text-hype-dim text-[10px]">Spotted</p>
          </div>
          <div className="text-center">
            <p className="text-hype-gold font-bold tabular">{avgMomentum}</p>
            <p className="text-hype-dim text-[10px]">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-hype-gold font-bold text-xs">{getMomentumTier(avgMomentum)}</p>
            <p className="text-hype-dim text-[10px]">Tier</p>
          </div>
        </div>
      </div>

      {/* My Spots */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">My Spots</p>
          {creatorsSpottedCount > 0 && (
            <span className="text-hype-gold text-xs font-semibold">{creatorsSpottedCount} total</span>
          )}
        </div>

        {spotsLoading && isSupabaseMode ? (
          <div className="flex items-center justify-center py-5">
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
          </div>
        ) : spottedCreators.length > 0 ? (
          <div className="space-y-2">
            {spottedCreators.slice(0, 6).map(creator => {
              if (!creator) return null
              const { score, delta } = getMomentum(creator.ticker)
              return (
                <Link
                  key={creator.ticker}
                  href={`/creator/${creator.ticker.toLowerCase()}`}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/6 hover:border-white/12 transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${creator.coverColor} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                    {creator.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{creator.name}</p>
                    <p className="text-white/35 text-[10px]">{creator.ticker}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">{score}</p>
                    <p className={`text-[10px] font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </p>
                  </div>
                </Link>
              )
            })}
            {spottedCreators.length > 6 && (
              <p className="text-white/25 text-xs text-center pt-1">
                +{spottedCreators.length - 6} more
              </p>
            )}
          </div>
        ) : (
          <div className="py-5 text-center">
            <p className="text-white/20 text-xs">No creators spotted yet.</p>
            <Link href="/explore" className="text-hype-gold/60 text-xs mt-1 block hover:text-hype-gold transition-colors">
              Discover creators →
            </Link>
          </div>
        )}
      </div>

      {/* Discovery Vault */}
      {(vaultLoading || vaultEntries.length > 0) && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-hype-text font-semibold text-sm">Discovery Vault</p>
              <p className="text-hype-dim text-[10px] mt-0.5">
                {vaultLoading ? 'Loading…' : `${vaultEntries.length} card${vaultEntries.length !== 1 ? 's' : ''} · Swipe to explore`}
              </p>
            </div>
            <div
              className="px-2 py-1 rounded-lg"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}
            >
              <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>
                Auto-saved
              </p>
            </div>
          </div>
          <div
            className="flex gap-4 overflow-x-auto pb-3"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}
          >
            {vaultEntries.map(entry => {
              const vaultEntry = vaultItems.find(v => v.ticker === entry.creator.ticker)
              return (
                <div key={entry.creator.ticker} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
                  <GoldDiscoveryCard
                    creator={entry.creator}
                    rank={entry.spotterRank}
                    score={entry.score}
                    tier={entry.tier}
                    userName={vaultUserName}
                    spotTime={entry.spotDate}
                    onClick={vaultEntry ? () => setVaultOpen({ entry: vaultEntry, creator: entry.creator }) : undefined}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spotter Collections */}
      {isSupabaseMode && (collectionLoading || collection.active.length > 0 || collection.movedOn.length > 0 || collection.rediscovered.length > 0) && (
        <div className="space-y-3">

          {/* Active Spots collection */}
          {(collectionLoading || collection.active.length > 0) && (
            <div className="premium-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-hype-text font-semibold text-sm">Active Spots</p>
                  {!collectionLoading && (
                    <p className="text-hype-dim text-[10px] mt-0.5">{collection.active.length} currently spotting</p>
                  )}
                </div>
                <div
                  className="px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}
                >
                  <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Gold
                  </p>
                </div>
              </div>
              {collectionLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
                </div>
              ) : collection.active.length === 0 ? (
                <p className="text-hype-dim text-xs text-center py-3">No active spots yet.</p>
              ) : (
                <div className="space-y-2">
                  {collection.active.map((rel, i) => (
                    <SpotterCard key={rel.id} rel={rel} variant="active" delay={i * 0.04} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moved On collection */}
          {(collectionLoading || collection.movedOn.length > 0) && (
            <div className="premium-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-hype-text font-semibold text-sm">Moved On</p>
                  {!collectionLoading && (
                    <p className="text-hype-dim text-[10px] mt-0.5">{collection.movedOn.length} artists</p>
                  )}
                </div>
                <div
                  className="px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(150,160,180,0.06)', border: '1px solid rgba(150,160,180,0.14)' }}
                >
                  <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(150,160,180,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Silver
                  </p>
                </div>
              </div>
              {collectionLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
                </div>
              ) : collection.movedOn.length === 0 ? (
                <p className="text-hype-dim text-xs text-center py-3">No moved-on spots yet.</p>
              ) : (
                <div className="space-y-2">
                  {collection.movedOn.map((rel, i) => (
                    <SpotterCard key={rel.id} rel={rel} variant="moved_on" delay={i * 0.04} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rediscovered collection (permanent) */}
          {(collectionLoading || collection.rediscovered.length > 0) && (
            <div className="premium-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-hype-text font-semibold text-sm">✦ Rediscovered</p>
                  {!collectionLoading && (
                    <p className="text-hype-dim text-[10px] mt-0.5">Permanent record · {collection.rediscovered.length} artists</p>
                  )}
                </div>
                <div
                  className="px-2 py-1 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(200,210,225,0.07) 0%, rgba(201,168,76,0.05) 100%)',
                    border: '1px solid rgba(200,210,225,0.2)',
                  }}
                >
                  <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(200,210,225,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Prem. Silver
                  </p>
                </div>
              </div>
              {collectionLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
                </div>
              ) : collection.rediscovered.length === 0 ? (
                <p className="text-hype-dim text-xs text-center py-3">Rediscover a creator to earn your first ✦.</p>
              ) : (
                <div className="space-y-2">
                  {collection.rediscovered.map((rel, i) => (
                    <SpotterCard key={rel.id} rel={rel} variant="rediscovered" delay={i * 0.04} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discovery Legacy */}
      {vaultItems.length > 0 && (() => {
        const totalSpotted = vaultItems.length
        const longestJourneyDays = vaultItems.reduce((max, e) => {
          const days = e.spotDurationDays ??
            Math.max(1, Math.floor(((e.archivedAt ?? new Date()).getTime() - e.spotDate.getTime()) / 86400000))
          return Math.max(max, days)
        }, 0)
        const totalChapters = vaultItems.reduce((sum, e) => sum + (e.rediscoveryCount ?? 0) + 1, 0)
        const breakoutWins = vaultItems.filter(e => e.currentScore - e.momentumAtSpot >= 28).length

        return (
          <div className="premium-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={14} className="text-hype-gold" />
              <p className="text-hype-text font-semibold text-sm">Discovery Legacy</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'All-Time Spotted', value: totalSpotted, gold: true },
                { label: 'Longest Journey', value: `${longestJourneyDays}d`, gold: false },
                { label: 'Total Chapters', value: totalChapters, gold: totalChapters > totalSpotted },
                { label: 'Breakout Wins', value: breakoutWins, gold: breakoutWins > 0 },
              ] as const).map(({ label, value, gold }) => (
                <div
                  key={label}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <p
                    className="font-black text-xl tabular leading-none mb-0.5"
                    style={{ color: gold ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.7)' }}
                  >
                    {value}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Discovery Score */}
      {discoveryScore > 0 && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-hype-gold" />
            <p className="text-hype-text font-semibold text-sm">Discovery Score</p>
          </div>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#C9A84C" strokeWidth="6"
                  strokeDasharray={`${(discoveryScore / 100) * 201} 201`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-black text-xl">{discoveryScore}</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-hype-muted">Breakouts found</span>
                  <span className="text-white font-semibold">{breakoutsIdentified}</span>
                </div>
                <div className="h-1 bg-hype-surface-3 rounded-full">
                  <div className="h-full bg-hype-gold rounded-full" style={{ width: `${Math.min((breakoutsIdentified / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-hype-muted">Momentum accuracy</span>
                  <span className="text-white font-semibold">{momentumAccuracy}%</span>
                </div>
                <div className="h-1 bg-hype-surface-3 rounded-full">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${momentumAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="inset-surface rounded-xl p-3 flex items-center gap-2">
              <Clock size={13} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-bold">{avgLeadDays} days</p>
                <p className="text-hype-dim text-[9px]">Avg lead time</p>
              </div>
            </div>
            <div className="inset-surface rounded-xl p-3 flex items-center gap-2">
              <Award size={13} className="text-hype-gold flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-bold">{breakoutsIdentified}</p>
                <p className="text-hype-dim text-[9px]">Breakouts called</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-hype-gold" />
            <p className="text-hype-text font-semibold text-sm">Discovery Badges</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-hype-gold/10 border border-hype-gold/20">
                <span className="text-sm">{BADGE_ICONS[badge] ?? '🏷️'}</span>
                <span className="text-hype-gold text-[10px] font-bold">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taste Profile */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">Taste Profile</p>
          <button onClick={() => setGenreSheetOpen(true)} className="text-hype-gold text-xs font-medium hover:text-hype-gold-dim transition-colors">
            {displayedGenres.length > 0 ? '+ Add more' : '+ Add genres'}
          </button>
        </div>
        {displayedGenres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayedGenres.map(g => (
              <button
                key={g.slug}
                onClick={async () => {
                  const next = genreSlugs.filter(s => s !== g.slug)
                  await saveGenres(next)
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hype-border bg-hype-surface hover:border-red-400/40 hover:bg-red-500/8 transition-all"
              >
                <span className="text-sm">{g.emoji}</span>
                <span className="text-hype-text text-xs font-medium group-hover:text-red-300 transition-colors">{g.label}</span>
                <X size={10} className="text-hype-dim group-hover:text-red-400 transition-colors ml-0.5" />
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => setGenreSheetOpen(true)} className="w-full py-4 rounded-xl border border-dashed border-white/15 text-white/30 text-xs hover:border-hype-gold/30 hover:text-hype-gold/50 transition-all">
            Tell us what you love → get a better feed
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-text font-semibold text-sm mb-3">Account Mode</p>
        <div className="flex gap-2">
          <button onClick={() => setUserMode('investor')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${userMode === 'investor' ? 'bg-hype-gold/10 border-hype-gold/30 text-hype-gold' : 'bg-hype-surface-2 border-hype-border text-hype-muted hover:text-hype-secondary'}`}>
            Spotter
          </button>
          <button onClick={() => setUserMode('creator')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${userMode === 'creator' ? 'bg-hype-purple/10 border-hype-purple/30 text-hype-purple' : 'bg-hype-surface-2 border-hype-border text-hype-muted hover:text-hype-secondary'}`}>
            Creator
          </button>
        </div>
        <p className="text-hype-dim text-[10px] mt-2 text-center">
          Switch to access {userMode === 'investor' ? 'Creator Dashboard' : 'Discovery Portfolio'}
        </p>
      </div>

      {/* Discovery Summary */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">Discovery Summary</p>
          <Link href="/portfolio" className="text-hype-gold text-xs font-medium hover:underline">View all</Link>
        </div>
        <div className="flex items-center gap-3 p-3 inset-surface rounded-xl">
          <Compass size={20} className="text-hype-gold flex-shrink-0" />
          <div>
            <p className="text-hype-text font-bold">{creatorsSpottedCount} creators spotted</p>
            <p className="text-hype-gold text-xs font-semibold">Avg momentum: {avgMomentum} · {getMomentumTier(avgMomentum)}</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border">
        {[
          { icon: Bell, label: 'Notifications', value: 'On' },
          { icon: Shield, label: 'Security & KYC', value: 'Mock' },
          { icon: Settings, label: 'Preferences', value: '' },
          { icon: HelpCircle, label: 'Help & Support', value: '' },
        ].map(({ icon: Icon, label, value }) => (
          <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-hype-surface-2 transition-colors">
            <Icon size={16} className="text-hype-muted flex-shrink-0" />
            <span className="text-hype-text text-sm font-medium flex-1 text-left">{label}</span>
            {value && <span className="text-hype-dim text-xs">{value}</span>}
            <ChevronRight size={14} className="text-hype-dim" />
          </button>
        ))}
      </div>

      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-dim text-[10px] leading-relaxed">
          SPOTLIGHT is a demonstration platform. Cultural Shares represent participation in a creator&apos;s discovery pool and do not constitute equity ownership, investment contracts, or financial instruments. This is not financial advice.
        </p>
      </div>

      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-hype-red text-sm font-semibold bg-transparent border border-hype-red/20 hover:bg-hype-red/8 transition-colors">
        <LogOut size={16} />
        Sign Out
      </button>

      <GenreManagerSheet open={genreSheetOpen} onClose={() => setGenreSheetOpen(false)} />

      {vaultOpen && (
        <VaultOpeningCinematic
          creator={vaultOpen.creator}
          entry={vaultOpen.entry}
          onClose={() => setVaultOpen(null)}
          userId={currentUser?.id}
          userName={(currentUser?.name ?? user.name).split(' ')[0] || 'You'}
        />
      )}
    </div>
  )
}
