'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { creators } from '@/lib/mock-data/creators'
import { getGenresForCreator } from '@/lib/mock-data/genres'
import type { Creator } from '@/types'
import type { SpotlightResult } from '@/lib/engine/types'
import type { MomentumResponse } from '@/app/api/momentum/route'

const FALLBACK_TICKER = 'APDHILLON'

export function useSpotlightCreator(): {
  creator: Creator
  result: SpotlightResult | null
  loading: boolean
  error: boolean
  retry: () => void
} {
  const { currentUser } = useAuth()
  const userId = currentUser?.id ?? 'khush'

  const fallback = creators.find(c => c.ticker === FALLBACK_TICKER)!
  const [creator, setCreator] = useState<Creator>(fallback)
  const [result, setResult] = useState<SpotlightResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const retry = useCallback(() => setRetryKey(k => k + 1), [])

  // Rebuild when user genres change (interests is an array — join for stable dep)
  const genreKey = (currentUser?.interests ?? []).join(',')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    // ── Try real momentum data first ────────────────────────────────────────
    fetch('/api/momentum')
      .then(r => r.ok ? r.json() as Promise<MomentumResponse> : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        if (cancelled) return
        if (!data.hasData || !data.entries.length) throw new Error('no_data')

        const homeHeroTicker = data.entries[0].ticker
        const userGenres = new Set(currentUser?.interests ?? [])

        // Filter to artists in the user's selected genres
        const genreMatches = userGenres.size > 0
          ? data.entries.filter(e => {
              const cGenres = getGenresForCreator(e.ticker)
              return cGenres.some(g => userGenres.has(g.id))
            })
          : data.entries

        // Pick highest-change artist from user's genres, skipping home hero
        const pick =
          genreMatches.find(e => e.ticker !== homeHeroTicker) ??
          genreMatches[0] ??                                        // all matched the hero
          data.entries.find(e => e.ticker !== homeHeroTicker) ??   // no genre match — any other
          data.entries[0]

        const found = creators.find(
          c => c.ticker.toUpperCase() === pick.ticker.toUpperCase()
        )
        if (!found) throw new Error('creator_not_found')

        setCreator(found)
        setResult(null) // momentum-driven; no SpotlightResult narrative
        setLoading(false)
      })
      .catch(() => {
        // ── Fall back to recommendation-engine spotlight ─────────────────────
        if (cancelled) return

        fetch(`/api/spotlight?userId=${userId}`)
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
          .then((data: SpotlightResult) => {
            if (cancelled) return
            const found = creators.find(
              c => c.ticker.toUpperCase() === data.ticker.toUpperCase()
            )
            if (found) {
              setCreator(found)
              setResult(data)
            } else {
              setError(true)
            }
          })
          .catch((err: unknown) => {
            if (cancelled) return
            if (process.env.NODE_ENV === 'development') console.error('[useSpotlightCreator]', err)
            setError(true)
          })
          .finally(() => { if (!cancelled) setLoading(false) })
      })

    return () => { cancelled = true }
  }, [userId, retryKey, genreKey, currentUser?.interests])

  return { creator, result, loading, error, retry }
}
