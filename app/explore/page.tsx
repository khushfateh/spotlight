'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect, useRef } from 'react'
import { AnimatePresence, motion }  from 'framer-motion'
import { Search, X, Layers, TrendingUp, Gem, Zap, Star, Flame } from 'lucide-react'
import Link from 'next/link'
import TradeSheet          from '@/components/trading/TradeSheet'
import { useTradeSheet }   from '@/hooks/useTradeSheet'
import SpotterAuthModal    from '@/components/auth/SpotterAuthModal'
import { trackAnonymousSpotAttempt } from '@/lib/services/anonymousTrackingService'
import {
  getCreatorsByCategory,
  getTrendingCreators,
  getMomentum,
  getMomentumTier,
} from '@/lib/mock-data'
import { genres } from '@/lib/mock-data/genres'
import { getCreatorsInGenre } from '@/lib/mock-data/genres'
import { cn } from '@/lib/utils'
import { DiscoverStack }   from '@/components/effects/DiscoverStack'
import { useDiscoverFeed } from '@/hooks/useDiscoverFeed'
import { useAuth }         from '@/context/AuthContext'
import { useSpots }        from '@/hooks/useSpots'
import { logCreatorSearch } from '@/lib/services/interactionService'
import type { Creator, CreatorCategory } from '@/types'
import ObservatoryScene    from '@/components/experience/observatory/ObservatoryScene'
import { obsState }        from '@/components/experience/observatory/observatoryState'

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (local — DO NOT export)
// ─────────────────────────────────────────────────────────────────────────────
const GOLD    = '#C9A84C'
const VOID    = '#050508'
const GLASS_BG     = 'rgba(7,5,13,0.72)'
const GLASS_BORDER = `1px solid rgba(201,168,76,0.15)`
const GLASS_FOCUS  = `1px solid rgba(201,168,76,0.52)`
const BLUR         = 'blur(22px)'

// ─────────────────────────────────────────────────────────────────────────────
// Lens definitions (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
type Lens = { id:string; label:string; icon:React.ReactNode; description:string }

const LENSES: Lens[] = [
  { id:'trending',  label:'Trending',       icon:<Flame size={12}/>,      description:'Highest momentum right now'    },
  { id:'rising',    label:'Rising Fast',    icon:<TrendingUp size={12}/>, description:'Biggest score gains this week' },
  { id:'breakout',  label:'Near Breakout',  icon:<Zap size={12}/>,        description:'About to cross to next tier'   },
  { id:'gems',      label:'Hidden Gems',    icon:<Gem size={12}/>,        description:'Under the radar, accelerating' },
  { id:'editors',   label:"Editor's Picks", icon:<Star size={12}/>,       description:'Curated by the SPOTLIGHT team' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Crystal Creator Row
// ─────────────────────────────────────────────────────────────────────────────
function CreatorListRow({ creator, rank, onBuy, onSelect, isSpotted = false }: {
  creator: Creator; rank: number; onBuy: (c: Creator) => void
  onSelect?: () => void; isSpotted?: boolean
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const up   = delta >= 0

  return (
    <Link href={`/creator/${creator.ticker.toLowerCase()}`} onClick={onSelect}>
      <motion.div
        initial={{ opacity:0, x: rank % 2 === 0 ? -40 : 40 }}
        whileInView={{ opacity:1, x:0 }}
        viewport={{ once:true, amount:0.1 }}
        transition={{ type:'spring', stiffness:60, damping:18, delay: Math.min(rank*0.04, 0.28) }}
        whileHover={{ x: rank % 2 === 0 ? 4 : -4 }}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors group"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}
      >
        {/* Rank */}
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(201,168,76,0.28)', width:18, flexShrink:0, textAlign:'center' }}>
          {String(rank).padStart(2,'0')}
        </span>

        {/* Avatar */}
        {creator.imageUrl ? (
          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0" style={{ boxShadow:`0 0 0 1px rgba(201,168,76,0.18)` }}>
            <img src={creator.imageUrl} alt="" className="w-full h-full object-cover object-center" />
          </div>
        ) : (
          <div className={cn('w-11 h-11 rounded-full flex-shrink-0', creator.coverColor)}
               style={{ boxShadow:`0 0 0 1px rgba(201,168,76,0.18)` }} />
        )}

        {/* Name + ticker */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color:'rgba(255,255,255,0.88)' }}>{creator.name}</p>
          <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(201,168,76,0.40)' }}>
            ${creator.ticker} · {creator.category}
          </p>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline justify-end gap-1.5">
            <p className="text-sm font-black tabular-nums" style={{ color:'rgba(255,255,255,0.85)' }}>{score}</p>
            <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{tier}</p>
          </div>
          <p className="text-[10px] font-semibold tabular-nums" style={{ color: up ? '#52d78a' : '#e05555' }}>
            {up ? '+' : ''}{delta} pts
          </p>
        </div>

        {/* Action */}
        {isSpotted ? (
          <span className="flex-shrink-0 px-2.5 py-1.5 text-[10px] font-semibold"
                style={{ border:`1px solid rgba(201,168,76,0.35)`, color:GOLD, borderRadius:2, background:'rgba(201,168,76,0.08)', fontFamily:'JetBrains Mono, monospace' }}>
            ✦ SPOTTED
          </span>
        ) : (
          <button
            onClick={e => { e.preventDefault(); onBuy(creator) }}
            className="flex-shrink-0 px-2.5 py-1.5 text-[10px] font-semibold transition-all active:scale-95"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.40)', borderRadius:2, fontFamily:'JetBrains Mono, monospace' }}
            onMouseEnter={e => { const t=e.currentTarget; t.style.background=GOLD; t.style.color='#0A0A0A'; t.style.border=`1px solid ${GOLD}` }}
            onMouseLeave={e => { const t=e.currentTarget; t.style.background='transparent'; t.style.color='rgba(255,255,255,0.40)'; t.style.border='1px solid rgba(255,255,255,0.12)' }}
          >
            SPOT
          </button>
        )}
      </motion.div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Crystal Genre Card
// ─────────────────────────────────────────────────────────────────────────────
function GenreCard({ genre, onSelect, index=0 }: { genre: typeof genres[0]; onSelect:(id:string)=>void; index?:number }) {
  return (
    <motion.button
      onClick={() => onSelect(genre.id)}
      initial={{ opacity:0, y:16, x:12 }}
      whileInView={{ opacity:1, y:0, x:0 }}
      viewport={{ once:true, amount:0.1 }}
      transition={{ type:'spring', stiffness:70, damping:18, delay: index * 0.05 }}
      whileHover={{ scale:1.05, y:-3 }}
      whileTap={{ scale:0.97 }}
      className="relative rounded-sm overflow-hidden text-left w-full"
      style={{ height:90, borderRadius:2 }}
    >
      {genre.imageUrl ? (
        <img src={genre.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-center scale-105" />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', genre.coverColor)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/30 to-black/10" />
      {/* Crystal frame */}
      <div className="absolute inset-0" style={{ border:'1px solid rgba(201,168,76,0.14)', borderRadius:2 }} />
      <div className="absolute inset-0 p-2.5 flex flex-col justify-end">
        <span className="text-sm leading-none">{genre.emoji}</span>
        <p className="text-white text-[10px] font-bold leading-tight mt-1 uppercase tracking-wider" style={{ fontFamily:'JetBrains Mono, monospace' }}>{genre.label}</p>
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Crystal Lens Chip
// ─────────────────────────────────────────────────────────────────────────────
const LENS_GLOW: Record<string, string> = {
  trending: 'rgba(251,146,60,0.18)',
  rising:   'rgba(52,211,153,0.18)',
  breakout: 'rgba(201,168,76,0.22)',
  gems:     'rgba(96,165,250,0.18)',
  editors:  'rgba(167,139,250,0.18)',
}
const LENS_COLOR: Record<string, string> = {
  trending: '#fb923c',
  rising:   '#34d399',
  breakout: GOLD,
  gems:     '#60a5fa',
  editors:  '#a78bfa',
}

function LensChip({ lens, active, onSelect }: { lens:Lens; active:boolean; onSelect:()=>void }) {
  const c = LENS_COLOR[lens.id] ?? GOLD
  const g = LENS_GLOW[lens.id] ?? 'rgba(201,168,76,0.18)'
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale:0.93 }}
      whileHover={{ y:-1 }}
      className="flex-shrink-0 flex items-center gap-1.5 transition-all"
      style={{
        padding:'5px 12px',
        borderRadius:2,
        fontSize:11,
        fontFamily:'JetBrains Mono, monospace',
        fontWeight:600,
        border: active ? `1px solid ${c}` : '1px solid rgba(255,255,255,0.10)',
        color:  active ? c : 'rgba(255,255,255,0.38)',
        background: active ? g : 'rgba(7,5,13,0.50)',
        backdropFilter: BLUR,
        WebkitBackdropFilter: BLUR,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        boxShadow: active ? `0 0 14px ${g}` : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {lens.icon}
      {lens.label}
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section heading
// ─────────────────────────────────────────────────────────────────────────────
function SectionEyebrow({ label }: { label:string }) {
  return (
    <p style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 9,
      color: 'rgba(201,168,76,0.40)',
      fontWeight: 600,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      marginBottom: 10,
    }}>
      {label}
    </p>
  )
}

function SectionTitle({ children, icon }: { children:React.ReactNode; icon?:React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 mb-1" style={{
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontWeight: 300,
      fontSize: 22,
      color: 'rgba(255,255,255,0.90)',
      letterSpacing: '0.01em',
    }}>
      {icon && <span style={{ color:GOLD }}>{icon}</span>}
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Glass container
// ─────────────────────────────────────────────────────────────────────────────
function GlassContainer({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{
      background: GLASS_BG,
      backdropFilter: BLUR,
      WebkitBackdropFilter: BLUR,
      border: GLASS_BORDER,
      borderRadius: 3,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Near Breakout card
// ─────────────────────────────────────────────────────────────────────────────
function BreakoutCard({ creator, index }: { creator:Creator; index:number }) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  return (
    <motion.div
      initial={{ opacity:0, y:20, x:16 }}
      whileInView={{ opacity:1, y:0, x:0 }}
      viewport={{ once:true, amount:0.1 }}
      whileHover={{ scale:1.03, y:-3 }}
      transition={{ type:'spring', stiffness:70, damping:18, delay: index*0.07 }}
      className="flex-shrink-0"
      style={{ width:118 }}
    >
      <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
        <div className="relative overflow-hidden" style={{ height:172, borderRadius:2, border:'1px solid rgba(201,168,76,0.12)' }}>
          {creator.imageUrl ? (
            <img src={creator.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/96 via-black/25 to-transparent" />
          {/* Delta badge */}
          <div className="absolute top-2 left-2">
            <span style={{
              display:'inline-flex', alignItems:'center', gap:2,
              padding:'2px 6px', borderRadius:1,
              background:'rgba(201,168,76,0.18)',
              color:GOLD,
              fontSize:8, fontWeight:700,
              fontFamily:'JetBrains Mono, monospace',
              border:'1px solid rgba(201,168,76,0.25)',
            }}>
              <TrendingUp size={6} /> +{delta}
            </span>
          </div>
          <div className="absolute bottom-0 p-2.5">
            <p className="text-white font-semibold leading-tight" style={{ fontSize:11 }}>{creator.name}</p>
            <p className="font-black tabular-nums mt-0.5" style={{ fontSize:13, color:'rgba(255,255,255,0.90)' }}>{score}</p>
            <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{tier}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Editorial Discovery Card — shared across all 4 sections
// ─────────────────────────────────────────────────────────────────────────────
function EditorialCard({ creator, index, badge, accentColor }: {
  creator: Creator
  index: number
  badge: string
  accentColor: { border: string; bg: string; text: string }
}) {
  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  return (
    <motion.div
      initial={{ opacity:0, y:22 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, amount:0.1 }}
      whileHover={{ scale:1.04, y:-5 }}
      transition={{ type:'spring', stiffness:70, damping:18, delay: index*0.07 }}
      className="flex-shrink-0"
      style={{ width:120 }}
    >
      <Link href={`/creator/${creator.ticker.toLowerCase()}`}>
        <div className="relative overflow-hidden" style={{ height:178, borderRadius:2, border:`1px solid ${accentColor.border}` }}>
          {creator.imageUrl ? (
            <img src={creator.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/22 to-transparent" />
          {/* Badge */}
          <div className="absolute top-2 left-2">
            <span style={{
              display:'inline-flex', alignItems:'center', gap:3,
              padding:'2px 7px', borderRadius:1,
              background: accentColor.bg,
              color: accentColor.text,
              fontSize:7, fontWeight:700,
              fontFamily:'JetBrains Mono, monospace',
              border:`1px solid ${accentColor.border}`,
              letterSpacing:'0.08em',
              whiteSpace:'nowrap',
            }}>
              {badge}
            </span>
          </div>
          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-white font-semibold leading-tight truncate" style={{ fontSize:11 }}>{creator.name}</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p className="font-black tabular-nums" style={{ fontSize:14, color:'rgba(255,255,255,0.92)' }}>{score}</p>
              <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:7, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{tier}</p>
            </div>
            <p className="tabular-nums" style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, fontWeight:600,
                        color: delta >= 0 ? '#52d78a' : '#e05555', marginTop:1 }}>
              {delta >= 0 ? '+' : ''}{delta} pts
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [query,          setQuery]          = useState('')
  const [activeLens,     setActiveLens]     = useState<string|null>(null)
  const [activeGenre,    setActiveGenre]    = useState<string|null>(null)
  const [discoverMode,   setDiscoverMode]   = useState(false)
  const [discoverCreators, setDiscoverCreators] = useState<Creator[]>([])
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [spotterAuthCreator, setSpotterAuthCreator] = useState<Creator|null>(null)
  const [page, setPage] = useState(1)
  const scrollRef      = useRef<HTMLDivElement>(null)  // unused
  const allCreatorsRef = useRef<HTMLElement>(null)
  const trade       = useTradeSheet()
  const { currentUser, isAuthenticated } = useAuth()
  const { spottedTickers } = useSpots()

  // ── Data ──────────────────────────────────────────────────────────────────
  const allCreators = useMemo(() => getCreatorsByCategory('All' as CreatorCategory), [])
  const gainers     = useMemo(() => getTrendingCreators(5), [])
  const { engineCreators, loading: engineLoading } = useDiscoverFeed(activeLens)

  // ── Sync cursor to obsState ────────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      obsState.pointerX = (e.clientX / window.innerWidth  - 0.5) * 2
      obsState.pointerY = (e.clientY / window.innerHeight - 0.5) * -2
    }
    window.addEventListener('mousemove', onMove, { passive:true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ── Sync window scroll to obsState ────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      obsState.scrollProgress = max > 0 ? window.scrollY / max : 0
    }
    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Search interaction logging ─────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) return
    const t = setTimeout(() => logCreatorSearch(currentUser?.id ?? null, query.trim()), 800)
    return () => clearTimeout(t)
  }, [query, currentUser?.id])

  // ── Discover mode ─────────────────────────────────────────────────────────
  function openDiscover() {
    const all = getCreatorsByCategory('All' as CreatorCategory)
    setDiscoverCreators([...all].sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta))
    setDiscoverMode(true)
  }

  // ── Filter handlers (reset to page 1 on any filter change) ───────────────
  function handleGenreSelect(id:string) { setActiveGenre(activeGenre===id ? null:id); setActiveLens(null); setPage(1) }
  function handleLensSelect(id:string)  { setActiveLens(activeLens===id ? null:id);   setActiveGenre(null); setPage(1) }

  // ── Auth-gated spot ───────────────────────────────────────────────────────
  function handleBuy(creator:Creator) {
    if (!isAuthenticated) {
      trackAnonymousSpotAttempt(creator.ticker, 'explore_page').catch(() => {})
      setSpotterAuthCreator(creator)
    } else {
      trade.openBuy(creator)
    }
  }

  // ── Filtered creator list ──────────────────────────────────────────────────
  const filteredCreators = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase()
      return allCreators.filter(c => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q))
    }
    if (activeGenre) {
      const tickers = getCreatorsInGenre(activeGenre)
      return allCreators.filter(c => tickers.includes(c.ticker))
    }
    if (activeLens) {
      if (engineCreators.length > 0) return engineCreators
      switch (activeLens) {
        case 'trending':  return [...allCreators].sort((a,b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
        case 'rising':    return [...allCreators].sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta).filter(c => getMomentum(c.ticker).delta > 0)
        case 'breakout':  return [...allCreators].filter(c => { const s=getMomentum(c.ticker).score; return s>=65 && s<80 }).sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
        case 'gems':      return [...allCreators].filter(c => getMomentum(c.ticker).score<70 && getMomentum(c.ticker).delta>5).sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
        case 'editors':   return getTrendingCreators(8)
        default:          return allCreators
      }
    }
    return [...allCreators].sort((a,b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
  }, [query, activeLens, activeGenre, allCreators, engineCreators])

  const activeLensData  = LENSES.find(l => l.id === activeLens)
  const activeGenreData = genres.find(g => g.id === activeGenre)

  // ── Editorial section data ─────────────────────────────────────────────────
  const nearBreakoutCreators = useMemo(() =>
    [...allCreators]
      .filter(c => { const s = getMomentum(c.ticker).score; return s >= 60 && s < 82 })
      .sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
      .slice(0, 7),
  [allCreators])

  const trendingCreators = useMemo(() =>
    [...allCreators]
      .sort((a,b) => getMomentum(b.ticker).score - getMomentum(a.ticker).score)
      .slice(0, 7),
  [allCreators])

  const hiddenGems = useMemo(() =>
    [...allCreators]
      .filter(c => getMomentum(c.ticker).delta > 0 && getMomentum(c.ticker).score < 72)
      .sort((a,b) => getMomentum(b.ticker).delta - getMomentum(a.ticker).delta)
      .slice(0, 7),
  [allCreators])

  const editorsPicks = useMemo(() => getTrendingCreators(6), [])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const inDefaultMode = !query && !activeLens && !activeGenre

  return (
    <>
      {/* 3D Observatory canvas — full-screen at z-3, handles its own background */}
      <ObservatoryScene query={query} />

      {/* Page content */}
      <div ref={scrollRef} style={{ position:'relative', zIndex:5, minHeight:'100svh', paddingBottom:160 }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO — full-width discovery panel
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ minHeight:'calc(100svh - 56px)', display:'flex', flexDirection:'column', justifyContent:'center' }}>

          {/* ── Discovery Control Panel — full width ─────────────────────── */}
          <div
            className="w-full flex flex-col justify-center"
            style={{
              padding:'clamp(32px,5vh,64px) clamp(24px,5vw,72px)',
            }}
          >
            {/* ── Eyebrow + headline ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity:0, y:-14 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
              style={{ marginBottom:24 }}
            >
              <p style={{
                fontFamily:'JetBrains Mono, monospace',
                fontSize:9, fontWeight:600,
                letterSpacing:'0.30em', textTransform:'uppercase',
                color:'rgba(201,168,76,0.40)', marginBottom:14,
              }}>
                ◆ The Observatory · Cultural Discovery
              </p>
              <h1 style={{
                fontFamily:'"Cormorant Garamond", Georgia, serif',
                fontWeight:300,
                fontSize:'clamp(40px, 5.5vw, 60px)',
                lineHeight:0.97,
                letterSpacing:'-0.01em',
                color:'rgba(255,255,255,0.93)',
                marginBottom:10,
              }}>
                Who&rsquo;s <em style={{ fontStyle:'italic', color:'rgba(201,168,76,0.85)' }}>next?</em>
              </h1>
              <p style={{
                fontFamily:'"Cormorant Garamond", Georgia, serif',
                fontWeight:300,
                fontSize:'clamp(15px, 1.8vw, 17px)',
                color:'rgba(255,255,255,0.36)',
                letterSpacing:'0.02em',
              }}>
                Discover tomorrow&rsquo;s cultural icons before the world does.
              </p>
            </motion.div>

            {/* ── Crystal search bar ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.55, delay:0.10, ease:[0.16,1,0.3,1] }}
              style={{ marginBottom:8 }}
            >
              <div className="relative" style={{ maxWidth:640 }}>
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: searchFocused ? GOLD : 'rgba(201,168,76,0.30)' }}
                />
                <input
                  type="text"
                  value={query}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onChange={e => { setQuery(e.target.value); setActiveLens(null); setActiveGenre(null); setPage(1) }}
                  placeholder="Search creators, genres, tickers…"
                  style={{
                    width:'100%',
                    background: GLASS_BG,
                    backdropFilter: BLUR, WebkitBackdropFilter: BLUR,
                    border: searchFocused ? GLASS_FOCUS : GLASS_BORDER,
                    borderRadius:2,
                    padding:'12px 42px',
                    color:'rgba(255,255,255,0.88)',
                    fontSize:12,
                    fontFamily:'JetBrains Mono, monospace',
                    outline:'none',
                    boxShadow: searchFocused
                      ? '0 0 0 1px rgba(201,168,76,0.08), 0 8px 32px rgba(0,0,0,0.55), 0 0 18px rgba(201,168,76,0.07)'
                      : '0 4px 24px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)',
                    transition:'border 0.2s ease, box-shadow 0.3s ease',
                  }}
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setPage(1) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color:'rgba(201,168,76,0.30)' }}
                    onMouseEnter={e => (e.currentTarget.style.color='rgba(201,168,76,0.80)')}
                    onMouseLeave={e => (e.currentTarget.style.color='rgba(201,168,76,0.30)')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Discover mode button ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ duration:0.5, delay:0.16 }}
              style={{ marginBottom:28 }}
            >
              <button
                onClick={openDiscover}
                className="flex items-center gap-2"
                style={{
                  padding:'6px 13px',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:2,
                  background:'rgba(7,5,13,0.50)',
                  backdropFilter:BLUR, WebkitBackdropFilter:BLUR,
                  color:'rgba(255,255,255,0.30)',
                  fontSize:9,
                  fontFamily:'JetBrains Mono, monospace',
                  fontWeight:600,
                  letterSpacing:'0.07em',
                  textTransform:'uppercase',
                  transition:'all 0.2s ease',
                }}
                onMouseEnter={e => { const t=e.currentTarget; t.style.color='rgba(255,255,255,0.55)'; t.style.borderColor='rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { const t=e.currentTarget; t.style.color='rgba(255,255,255,0.30)'; t.style.borderColor='rgba(255,255,255,0.07)' }}
              >
                <Layers size={10} />
                Swipe to discover by feel
              </button>
            </motion.div>

            {/* ── Discovery Lenses ───────────────────────────────────────── */}
            {!query && (
              <motion.div
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.14 }}
                style={{ marginBottom:22 }}
              >
                <p style={{
                  fontFamily:'JetBrains Mono, monospace',
                  fontSize:8, fontWeight:600,
                  letterSpacing:'0.26em', textTransform:'uppercase',
                  color:'rgba(201,168,76,0.35)', marginBottom:10,
                }}>
                  Discovery Lens
                </p>
                <div className="flex flex-wrap gap-2">
                  {LENSES.map((lens, i) => (
                    <motion.div
                      key={lens.id}
                      initial={{ opacity:0, x:12 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ type:'spring', stiffness:70, damping:18, delay: i*0.06 }}
                    >
                      <LensChip lens={lens} active={activeLens===lens.id} onSelect={() => handleLensSelect(lens.id)} />
                    </motion.div>
                  ))}
                </div>
                <AnimatePresence>
                  {activeLensData && (
                    <motion.p
                      initial={{ opacity:0, height:0 }}
                      animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }}
                      style={{ fontSize:10, color:'rgba(201,168,76,0.38)', fontFamily:'JetBrains Mono, monospace', marginTop:8 }}
                    >
                      — {activeLensData.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Genre Crystals ─────────────────────────────────────────── */}
            {!query && !activeLens && (
              <motion.div
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.20 }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <p style={{
                    fontFamily:'JetBrains Mono, monospace',
                    fontSize:8, fontWeight:600,
                    letterSpacing:'0.26em', textTransform:'uppercase',
                    color:'rgba(201,168,76,0.35)',
                  }}>
                    Browse by Genre
                  </p>
                  {activeGenre && (
                    <button
                      onClick={() => { setActiveGenre(null); setPage(1) }}
                      style={{ fontSize:9, color:GOLD, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' }}
                    >
                      CLEAR
                    </button>
                  )}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10 }}>
                  {genres.map((genre, i) => (
                    <div key={genre.id}
                         style={{ outline: activeGenre===genre.id ? `1px solid ${GOLD}` : 'none', borderRadius:2 }}>
                      <GenreCard genre={genre} onSelect={handleGenreSelect} index={i} />
                    </div>
                  ))}
                </div>
                {activeGenreData && (
                  <p style={{ fontSize:10, color:'rgba(201,168,76,0.38)', fontFamily:'JetBrains Mono, monospace', marginTop:8 }}>
                    — {activeGenreData.description}
                  </p>
                )}
              </motion.div>
            )}
          </div>

        </div>{/* end hero */}

        {/* ═══════════════════════════════════════════════════════════════════
            EDITORIAL DISCOVERY — 4 sections below the fold
        ═══════════════════════════════════════════════════════════════════ */}
        {inDefaultMode && (
          <div style={{ paddingTop:64 }}>

            {/* Gold hairline divider with label */}
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0 24px', marginBottom:52 }}>
              <div style={{ flex:1, height:1, background:'linear-gradient(to right, rgba(201,168,76,0.28), rgba(201,168,76,0))' }} />
              <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:8, color:'rgba(201,168,76,0.40)', letterSpacing:'0.28em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                Editorial Discovery
              </p>
              <div style={{ flex:1, height:1, background:'linear-gradient(to left, rgba(201,168,76,0.28), rgba(201,168,76,0))' }} />
            </div>

            {/* ── Near Breakout ────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, amount:0.1 }}
              transition={{ type:'spring', stiffness:70, damping:18 }}
              style={{ marginBottom:52 }}
            >
              <div style={{ padding:'0 24px', marginBottom:18 }}>
                <SectionEyebrow label="Near Breakout" />
                <SectionTitle icon={<Zap size={16}/>}>Approaching the threshold</SectionTitle>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.26)', fontFamily:'JetBrains Mono, monospace', marginTop:3 }}>
                  Momentum rising — spot them before the tier flip.
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ paddingLeft:24, paddingRight:24, scrollbarWidth:'none' }}>
                {nearBreakoutCreators.map((c,i) => (
                  <EditorialCard key={c.id} creator={c} index={i} badge="↑ BREAKOUT"
                    accentColor={{ border:'rgba(201,168,76,0.18)', bg:'rgba(201,168,76,0.12)', text:GOLD }}
                  />
                ))}
              </div>
            </motion.section>

            {/* ── Trending Now ─────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, amount:0.1 }}
              transition={{ type:'spring', stiffness:70, damping:18, delay:0.06 }}
              style={{ marginBottom:52 }}
            >
              <div style={{ padding:'0 24px', marginBottom:18 }}>
                <SectionEyebrow label="Trending Now" />
                <SectionTitle icon={<Flame size={16}/>}>Highest momentum</SectionTitle>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.26)', fontFamily:'JetBrains Mono, monospace', marginTop:3 }}>
                  The cultural moment, right now.
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ paddingLeft:24, paddingRight:24, scrollbarWidth:'none' }}>
                {trendingCreators.map((c,i) => (
                  <EditorialCard key={c.id} creator={c} index={i} badge="◆ TRENDING"
                    accentColor={{ border:'rgba(251,146,60,0.18)', bg:'rgba(251,146,60,0.11)', text:'#fb923c' }}
                  />
                ))}
              </div>
            </motion.section>

            {/* ── Hidden Gems ──────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, amount:0.1 }}
              transition={{ type:'spring', stiffness:70, damping:18, delay:0.10 }}
              style={{ marginBottom:52 }}
            >
              <div style={{ padding:'0 24px', marginBottom:18 }}>
                <SectionEyebrow label="Hidden Gems" />
                <SectionTitle icon={<Gem size={16}/>}>Under the radar</SectionTitle>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.26)', fontFamily:'JetBrains Mono, monospace', marginTop:3 }}>
                  Rising fast before the world catches on.
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ paddingLeft:24, paddingRight:24, scrollbarWidth:'none' }}>
                {hiddenGems.map((c,i) => (
                  <EditorialCard key={c.id} creator={c} index={i} badge="◆ GEM"
                    accentColor={{ border:'rgba(96,165,250,0.18)', bg:'rgba(96,165,250,0.11)', text:'#60a5fa' }}
                  />
                ))}
              </div>
            </motion.section>

            {/* ── Editor's Picks ───────────────────────────────────────── */}
            <motion.section
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, amount:0.1 }}
              transition={{ type:'spring', stiffness:70, damping:18, delay:0.14 }}
              style={{ marginBottom:64 }}
            >
              <div style={{ padding:'0 24px', marginBottom:18 }}>
                <SectionEyebrow label="Editor's Picks" />
                <SectionTitle icon={<Star size={16}/>}>Curated by SPOTLIGHT</SectionTitle>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.26)', fontFamily:'JetBrains Mono, monospace', marginTop:3 }}>
                  The ones we&apos;re watching this week.
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ paddingLeft:24, paddingRight:24, scrollbarWidth:'none' }}>
                {editorsPicks.map((c,i) => (
                  <EditorialCard key={c.id} creator={c} index={i} badge="★ PICK"
                    accentColor={{ border:'rgba(167,139,250,0.18)', bg:'rgba(167,139,250,0.11)', text:'#a78bfa' }}
                  />
                ))}
              </div>
            </motion.section>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ALL CREATORS LIST — paginated 25 per page
        ═══════════════════════════════════════════════════════════════════ */}
        <section ref={allCreatorsRef} className="px-6" style={{ paddingTop: inDefaultMode ? 0 : 64 }}>
          {(() => {
            const PAGE_SIZE   = 25
            const totalPages  = Math.max(1, Math.ceil(filteredCreators.length / PAGE_SIZE))
            const safePage    = Math.min(page, totalPages)
            const pageCreators = filteredCreators.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE)
            const rankOffset  = (safePage-1)*PAGE_SIZE

            return (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <SectionEyebrow label={
                      query ? 'Search Results'
                      : activeLensData ? activeLensData.label
                      : activeGenreData ? activeGenreData.label
                      : 'All Creators'
                    } />
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <SectionTitle>
                        {query ? `"${query}"`
                          : activeGenreData ? activeGenreData.label
                          : activeLensData  ? activeLensData.label
                          : 'Ranked by Momentum'}
                      </SectionTitle>
                      {activeLens && engineLoading && (
                        <span className="inline-block w-3 h-3 rounded-full border border-hype-gold/40 border-t-hype-gold animate-spin" />
                      )}
                    </div>
                    <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'rgba(201,168,76,0.32)', marginTop:2 }}>
                      {filteredCreators.length} creators
                      {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
                      {activeLens && engineCreators.length>0 && ' · engine ranked'}
                    </p>
                  </div>
                  {(activeLens || activeGenre) && (
                    <button
                      onClick={() => { setActiveLens(null); setActiveGenre(null); setPage(1) }}
                      className="flex items-center gap-1"
                      style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontFamily:'JetBrains Mono, monospace' }}
                      onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}
                      onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.28)')}
                    >
                      <X size={10} /> CLEAR
                    </button>
                  )}
                </div>

                {activeLens && engineLoading ? (
                  <GlassContainer>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse"
                           style={{ borderBottom:'1px solid rgba(201,168,76,0.06)' }}>
                        <div className="w-5 h-3 rounded" style={{ background:'rgba(255,255,255,0.05)' }} />
                        <div className="w-10 h-10 rounded-full" style={{ background:'rgba(255,255,255,0.07)' }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 rounded" style={{ background:'rgba(255,255,255,0.07)' }} />
                          <div className="h-2 w-20 rounded" style={{ background:'rgba(255,255,255,0.04)' }} />
                        </div>
                        <div className="w-12 h-8 rounded" style={{ background:'rgba(255,255,255,0.07)' }} />
                      </div>
                    ))}
                  </GlassContainer>
                ) : pageCreators.length > 0 ? (
                  <GlassContainer>
                    {pageCreators.map((c,i) => (
                      <CreatorListRow
                        key={c.id}
                        creator={c}
                        rank={rankOffset+i+1}
                        onBuy={handleBuy}
                        onSelect={query.trim() ? () => logCreatorSearch(currentUser?.id ?? null, query.trim(), c.ticker) : undefined}
                        isSpotted={spottedTickers.includes(c.ticker.toUpperCase())}
                      />
                    ))}
                  </GlassContainer>
                ) : (
                  <div className="py-14 text-center">
                    <p style={{ color:'rgba(255,255,255,0.38)', fontFamily:'"Cormorant Garamond", Georgia, serif', fontSize:18, fontWeight:300, marginBottom:10 }}>
                      No creators found.
                    </p>
                    <button
                      onClick={() => { setQuery(''); setActiveLens(null); setActiveGenre(null); setPage(1) }}
                      style={{ color:GOLD, fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em', textDecoration:'underline' }}
                    >
                      RESET FILTERS
                    </button>
                  </div>
                )}

                {/* ── Crystal Pagination ─────────────────────────────── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    <button
                      onClick={() => { setPage(p => Math.max(1,p-1)); allCreatorsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }) }}
                      disabled={safePage===1}
                      style={{
                        width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                        border:'1px solid rgba(201,168,76,0.15)', borderRadius:2,
                        color: safePage===1 ? 'rgba(255,255,255,0.18)' : 'rgba(201,168,76,0.55)',
                        background:'rgba(7,5,13,0.60)', backdropFilter:BLUR, WebkitBackdropFilter:BLUR,
                        cursor: safePage===1 ? 'default' : 'pointer',
                        fontSize:12, fontFamily:'JetBrains Mono, monospace', transition:'all 0.15s ease',
                      }}
                    >‹</button>

                    {Array.from({ length: totalPages }, (_,i) => i+1).map(n => {
                      const show = n===1 || n===totalPages || Math.abs(n-safePage)<=2
                      const isEllipsis = !show && (n===2 || n===totalPages-1)
                      if (!show && !isEllipsis) return null
                      if (isEllipsis) return (
                        <span key={`e${n}`} style={{ color:'rgba(255,255,255,0.22)', fontFamily:'JetBrains Mono, monospace', fontSize:10, width:20, textAlign:'center' }}>…</span>
                      )
                      const active = n===safePage
                      return (
                        <button
                          key={n}
                          onClick={() => { setPage(n); allCreatorsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }) }}
                          style={{
                            minWidth:32, height:32, padding:'0 6px',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            border: active ? `1px solid ${GOLD}` : '1px solid rgba(201,168,76,0.12)',
                            borderRadius:2,
                            background: active ? 'rgba(201,168,76,0.14)' : 'rgba(7,5,13,0.60)',
                            backdropFilter:BLUR, WebkitBackdropFilter:BLUR,
                            color: active ? GOLD : 'rgba(255,255,255,0.38)',
                            fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight: active ? 700 : 400,
                            boxShadow: active ? `0 0 10px rgba(201,168,76,0.18)` : 'none',
                            cursor:'pointer', transition:'all 0.15s ease',
                          }}
                        >
                          {n}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => { setPage(p => Math.min(totalPages,p+1)); allCreatorsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }) }}
                      disabled={safePage===totalPages}
                      style={{
                        width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                        border:'1px solid rgba(201,168,76,0.15)', borderRadius:2,
                        color: safePage===totalPages ? 'rgba(255,255,255,0.18)' : 'rgba(201,168,76,0.55)',
                        background:'rgba(7,5,13,0.60)', backdropFilter:BLUR, WebkitBackdropFilter:BLUR,
                        cursor: safePage===totalPages ? 'default' : 'pointer',
                        fontSize:12, fontFamily:'JetBrains Mono, monospace', transition:'all 0.15s ease',
                      }}
                    >›</button>
                  </div>
                )}
              </>
            )
          })()}
        </section>

        <div className="text-center mt-12 px-5">
          <p style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'rgba(255,255,255,0.12)', letterSpacing:'0.14em' }}>
            MOCK DATA ONLY · NOT FINANCIAL ADVICE
          </p>
        </div>
      </div>{/* end content wrapper */}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {discoverMode && (
          <DiscoverStack
            creators={discoverCreators}
            onBuy={handleBuy}
            onClose={() => setDiscoverMode(false)}
            spottedTickers={spottedTickers}
          />
        )}
      </AnimatePresence>

      <TradeSheet
        isOpen={trade.isOpen}
        creator={trade.creator}
        tradeType={trade.tradeType}
        step={trade.step as 'form'|'confirm'|'success'|'error'}
        pendingOrder={trade.pendingOrder}
        isSubmitting={trade.isSubmitting}
        onClose={trade.close}
        onSpotNow={trade.spotNow}
        onSubmitOrder={trade.submitOrder}
        onConfirmOrder={trade.confirmOrder}
        onReset={trade.reset}
      />

      {spotterAuthCreator && (
        <SpotterAuthModal creator={spotterAuthCreator} onClose={() => setSpotterAuthCreator(null)} />
      )}
    </>
  )
}
