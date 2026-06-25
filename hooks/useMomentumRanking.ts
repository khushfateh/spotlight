'use client'

import { useState, useEffect } from 'react'
import type { MomentumEntry, MomentumResponse } from '@/app/api/momentum/route'

export type { MomentumEntry }

export function useMomentumRanking(): {
  entries: MomentumEntry[]
  hasData: boolean
  loading: boolean
} {
  const [entries, setEntries] = useState<MomentumEntry[]>([])
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/momentum')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: MomentumResponse) => {
        if (cancelled) return
        setEntries(data.entries)
        setHasData(data.hasData)
      })
      .catch(() => {
        // No real data — caller falls back to mock
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { entries, hasData, loading }
}
