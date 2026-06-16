'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { creators } from '@/lib/mock-data/creators'
import type { Creator } from '@/types'
import type { SpotlightResult } from '@/lib/engine/types'

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

  const retry = useCallback(() => {
    setRetryKey(k => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`/api/spotlight?userId=${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: SpotlightResult) => {
        if (cancelled) return
        const found = creators.find(c => c.ticker.toUpperCase() === data.ticker.toUpperCase())
        if (found) {
          setCreator(found)
          setResult(data)
        } else {
          // API returned an unrecognised ticker — stay on fallback
          setError(true)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (process.env.NODE_ENV === 'development') {
          console.error('[useSpotlightCreator]', err)
        }
        setError(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [userId, retryKey])

  return { creator, result, loading, error, retry }
}
