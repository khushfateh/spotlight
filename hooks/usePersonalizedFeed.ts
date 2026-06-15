'use client'

import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getHomeSections } from '@/lib/mock-data/recommendations'
import type { HomeSection } from '@/lib/mock-data/recommendations'

export function usePersonalizedFeed(): { sections: HomeSection[]; userId: string } {
  const { currentUser } = useAuth()
  const userId = currentUser?.id ?? 'khush'

  const sections = useMemo(() => getHomeSections(userId), [userId])

  return { sections, userId }
}
