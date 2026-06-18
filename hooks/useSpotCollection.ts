'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserCollection, type SpotCollection, type SpotRelationship } from '@/lib/services/spotterService'
import { supabase } from '@/lib/supabase/client'

const EMPTY: SpotCollection = { active: [], movedOn: [], rediscovered: [] }

export function useSpotCollection() {
  const { currentUser, isSupabaseMode } = useAuth()
  const [collection, setCollection] = useState<SpotCollection>(EMPTY)
  const [loading, setLoading] = useState(false)

  const fetchCollection = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const result = await getUserCollection(currentUser.id)
    setCollection(result)
    setLoading(false)
  }, [isSupabaseMode, currentUser])

  useEffect(() => {
    if (isSupabaseMode) {
      fetchCollection()
    } else {
      setCollection(EMPTY)
    }
  }, [isSupabaseMode, currentUser, fetchCollection])

  // Realtime: refetch on any user_artist_spots change
  useEffect(() => {
    if (!isSupabaseMode || !currentUser || !supabase) return
    const sb = supabase
    const channel = sb
      .channel(`uas:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_artist_spots',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => { fetchCollection() },
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [isSupabaseMode, currentUser, fetchCollection])

  function getRelationshipByTicker(ticker: string): SpotRelationship | undefined {
    const all = [...collection.active, ...collection.movedOn, ...collection.rediscovered]
    const seen = new Set<string>()
    return all.find(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return r.ticker.toUpperCase() === ticker.toUpperCase()
    })
  }

  return { collection, loading, getRelationshipByTicker, refetch: fetchCollection }
}
