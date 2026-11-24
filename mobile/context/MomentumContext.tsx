import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { getMomentum, getMomentumTier } from '@/lib/data/momentum'

// ── Types ────────────────────────────────────────────────────────────────────

export type LiveScore = {
  ticker:   string
  score:    number
  delta:    number   // weekly point change
  tier:     string
  breakout: boolean
  isLive:   boolean  // false = fell back to static data
}

type ContextValue = {
  getScore:  (ticker: string) => LiveScore
  scores:    LiveScore[]
  loading:   boolean
  isLive:    boolean  // true if at least one live fetch succeeded
  refresh:   () => Promise<void>
}

// ── Cache ────────────────────────────────────────────────────────────────────

const CACHE_KEY = '@spotlight/momentum_v1'
const CACHE_TTL = 3 * 60 * 1000  // 3 minutes, same as web

type CacheEntry = {
  data: Array<{ ticker: string; score: number; delta: number; breakout: boolean }>
  ts:   number
}

async function readCache(): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.ts > CACHE_TTL) return null
    return entry
  } catch {
    return null
  }
}

async function writeCache(data: CacheEntry['data']): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

// ── Context ──────────────────────────────────────────────────────────────────

const MomentumContext = createContext<ContextValue | null>(null)

export function MomentumProvider({ children }: { children: React.ReactNode }) {
  const [liveMap, setLiveMap] = useState<Map<string, LiveScore>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isLive,  setIsLive]  = useState(false)
  const fetchedOnce = useRef(false)

  const fetchScores = useCallback(async () => {
    // Try cache first (avoid re-fetching within TTL)
    const cached = await readCache()
    if (cached && fetchedOnce.current) {
      hydrate(cached.data)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke<{
        scores: Array<{ ticker: string; score: number; delta: number; breakout: boolean }>
        generatedAt: string
      }>('momentum')

      if (error || !data?.scores?.length) throw new Error(error?.message ?? 'empty')

      await writeCache(data.scores)
      hydrate(data.scores)
      setIsLive(true)
    } catch {
      // Fall back to cache (even stale), then static
      const staleCache = await readCache().catch(() => null)
        ?? (await AsyncStorage.getItem(CACHE_KEY).then(r => r ? JSON.parse(r) as CacheEntry : null).catch(() => null))
      if (staleCache) {
        hydrate(staleCache.data)
      }
      // isLive stays false — UI can indicate scores are from static fallback
    } finally {
      fetchedOnce.current = true
      setLoading(false)
    }
  }, [])

  function hydrate(raw: CacheEntry['data']) {
    const map = new Map<string, LiveScore>()
    for (const r of raw) {
      map.set(r.ticker.toUpperCase(), {
        ticker:   r.ticker.toUpperCase(),
        score:    r.score,
        delta:    r.delta,
        tier:     getMomentumTier(r.score),
        breakout: r.breakout,
        isLive:   true,
      })
    }
    setLiveMap(map)
  }

  useEffect(() => { fetchScores() }, [fetchScores])

  // Auto-refresh when TTL expires
  useEffect(() => {
    const timer = setTimeout(() => fetchScores(), CACHE_TTL + 1000)
    return () => clearTimeout(timer)
  }, [liveMap, fetchScores])

  const getScore = useCallback((ticker: string): LiveScore => {
    const upper = ticker.toUpperCase()
    const live  = liveMap.get(upper)
    if (live) return live
    // Static fallback — always gives something reasonable
    const { score, delta } = getMomentum(upper)
    return { ticker: upper, score, delta, tier: getMomentumTier(score), breakout: false, isLive: false }
  }, [liveMap])

  const scores = Array.from(liveMap.values()).sort((a, b) => b.score - a.score)

  return (
    <MomentumContext.Provider value={{ getScore, scores, loading, isLive, refresh: fetchScores }}>
      {children}
    </MomentumContext.Provider>
  )
}

export function useMomentum(): ContextValue {
  const ctx = useContext(MomentumContext)
  if (!ctx) throw new Error('useMomentum must be used inside MomentumProvider')
  return ctx
}
