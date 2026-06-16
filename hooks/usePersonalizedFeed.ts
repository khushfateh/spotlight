'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getPersonalizedHome } from '@/lib/services/recommendationService'
import { getHomeSections } from '@/lib/mock-data/recommendations'
import type { HomeSection } from '@/lib/mock-data/recommendations'

export function usePersonalizedFeed(): { sections: HomeSection[]; userId: string; loading: boolean } {
  const { currentUser } = useAuth()
  const userId = currentUser?.id ?? 'khush'
  const [sections, setSections] = useState<HomeSection[]>(() => getHomeSections(userId))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getPersonalizedHome(userId).then(result => {
      if (cancelled) return
      // Fall back to static mock sections if engine returns nothing
      setSections(result.length > 0 ? result : getHomeSections(userId))
      setLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setSections(getHomeSections(userId))
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [userId])

  return { sections, userId, loading }
}
