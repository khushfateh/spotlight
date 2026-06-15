'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserActivity } from '@/lib/services/activityService'
import type { SupabaseActivity } from '@/lib/supabase/types'

export function useUserActivity(limit = 20) {
  const { currentUser, isSupabaseMode } = useAuth()
  const [activity, setActivity] = useState<SupabaseActivity[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivity = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const data = await getUserActivity(currentUser.id, limit)
    setActivity(data)
    setLoading(false)
  }, [isSupabaseMode, currentUser, limit])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  return { activity, loading, refetch: fetchActivity }
}
