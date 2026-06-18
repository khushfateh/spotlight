'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getPersonalizedHome } from '@/lib/services/recommendationService'
import { getHomeSections } from '@/lib/mock-data/recommendations'
import type { HomeSection } from '@/lib/mock-data/recommendations'

// Known demo user IDs that have hardcoded mock sections
const MOCK_USER_IDS = new Set(['khush', 'maya', 'jordan', 'ariana'])

export function usePersonalizedFeed(): { sections: HomeSection[]; userId: string; loading: boolean } {
  const { currentUser, isSupabaseMode } = useAuth()
  const userId = currentUser?.id ?? 'khush'
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In Supabase mode with no logged-in user, skip the engine entirely
    if (isSupabaseMode && !currentUser) {
      setSections([])
      setLoading(false)
      return
    }
    let cancelled = false
    getPersonalizedHome(userId).then(result => {
      if (cancelled) return
      if (result.length > 0) {
        setSections(result)
      } else if (!isSupabaseMode && MOCK_USER_IDS.has(userId)) {
        // Only use hardcoded mock sections for known demo users in mock mode
        setSections(getHomeSections(userId))
      } else {
        // Real user with no activity yet — engine returned nothing, show empty
        // (HomeFeed shows "Spot some creators to personalise your feed")
        setSections([])
      }
      setLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setSections(!isSupabaseMode && MOCK_USER_IDS.has(userId) ? getHomeSections(userId) : [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [userId, isSupabaseMode])

  return { sections, userId, loading }
}
