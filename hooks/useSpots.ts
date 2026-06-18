'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserSpottedTickers, logSpot, removeSpot, archiveSpot, rediscoverSpot } from '@/lib/services/spotService'
import { spotCreator, moveOnCreator } from '@/lib/services/spotterService'
import { logDiscoveryCard } from '@/lib/services/vaultService'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { supabase } from '@/lib/supabase/client'

export function useSpots() {
  const { currentUser, isSupabaseMode } = useAuth()
  const [spottedTickers, setSpottedTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSpots = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const tickers = await getUserSpottedTickers(currentUser.id)
    setSpottedTickers(tickers)
    setLoading(false)
  }, [isSupabaseMode, currentUser])

  useEffect(() => {
    if (isSupabaseMode) {
      fetchSpots()
    } else {
      setSpottedTickers(currentUser?.spottedTickers ?? [])
    }
  }, [isSupabaseMode, currentUser, fetchSpots])

  // Realtime: refetch whenever the spots table changes for this user
  useEffect(() => {
    if (!isSupabaseMode || !currentUser || !supabase) return
    const sb = supabase
    const channel = sb
      .channel(`spots:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spots', filter: `user_id=eq.${currentUser.id}` },
        () => { fetchSpots() },
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [isSupabaseMode, currentUser, fetchSpots])

  async function spot(ticker: string) {
    // Optimistic update
    setSpottedTickers(prev => [...new Set([...prev, ticker.toUpperCase()])])
    if (isSupabaseMode && currentUser) {
      // Try the new RPC first (requires spotter_system migration to be run).
      // If it fails (migration not yet applied), fall back to direct spots insert
      // so spots always persist regardless of migration state.
      const result = await spotCreator(currentUser.id, ticker).catch(() => null)
      if (!result) {
        await logSpot(currentUser.id, ticker).catch(() => {})
      }
      const { score } = getMomentum(ticker)
      const tier = getMomentumTier(score)
      const spotterNum = result?.spotterNumber ?? 0
      logDiscoveryCard(currentUser.id, ticker, spotterNum, score, tier).catch(() => {})
    }
  }

  async function unspot(ticker: string) {
    setSpottedTickers(prev => prev.filter(t => t !== ticker.toUpperCase()))
    if (isSupabaseMode && currentUser) {
      await removeSpot(currentUser.id, ticker)
    }
  }

  async function moveOn(ticker: string, durationDays: number) {
    // Optimistic: remove immediately so UI updates without waiting for realtime
    setSpottedTickers(prev => prev.filter(t => t !== ticker.toUpperCase()))
    if (isSupabaseMode && currentUser) {
      // Both ops are awaited so that by the time the user can navigate away from
      // the cinematic, user_artist_spots.is_currently_spotted=false is committed
      // and the profile's fetchCollection() on mount sees the correct state.
      // archiveSpot first: marks spots.spot_status='archived' (reliable realtime UPDATE)
      // then deletes the row. moveOnCreator second: updates user_artist_spots.
      await archiveSpot(currentUser.id, ticker, durationDays).catch(() => {})
      await moveOnCreator(currentUser.id, ticker, durationDays).catch(() => {})
    }
  }

  async function rediscover(ticker: string) {
    // Optimistic: re-add to active spots immediately
    setSpottedTickers(prev => [...new Set([...prev, ticker.toUpperCase()])])
    if (isSupabaseMode && currentUser) {
      // RPC detects rediscovery; falls back to direct insert if migration not yet run
      const result = await spotCreator(currentUser.id, ticker).catch(() => null)
      if (!result) {
        await logSpot(currentUser.id, ticker).catch(() => {})
      }
      rediscoverSpot(currentUser.id, ticker).catch(() => {})
    }
  }

  function isSpotted(ticker: string) {
    return spottedTickers.includes(ticker.toUpperCase())
  }

  return { spottedTickers, loading, spot, unspot, moveOn, rediscover, isSpotted, refetch: fetchSpots }
}
