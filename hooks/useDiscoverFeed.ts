'use client'

import { useState, useEffect } from 'react'
import type { Creator } from '@/types'

export function useDiscoverFeed(lens: string | null) {
  const [engineCreators, setEngineCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lens) {
      setEngineCreators([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/discover?lens=${lens}&limit=20`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { creators: Creator[] } | null) => {
        if (cancelled) return
        setEngineCreators(data?.creators ?? [])
      })
      .catch(() => { if (!cancelled) setEngineCreators([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lens])

  return { engineCreators, loading }
}
