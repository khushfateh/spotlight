import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserSpottedTickers, logSpot, archiveSpot } from '@/lib/services/spotService'
import { spotCreator, moveOnCreator } from '@/lib/services/spotterService'
import { logDiscoveryCard } from '@/lib/services/vaultService'
import { getMomentum, getMomentumTier } from '@/lib/data/momentum'

export type SpotResult = {
  spotterNumber: number
  isRediscovery:  boolean
}

export function useSpots() {
  const { user, isAuthenticated } = useAuth()
  const [spottedTickers, setSpottedTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSpots = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const tickers = await getUserSpottedTickers(user.id).catch(() => [])
    setSpottedTickers(tickers)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSpots()
    } else {
      setSpottedTickers([])
    }
  }, [isAuthenticated, user])

  // Realtime: re-fetch when spots table changes for this user
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`spots:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spots', filter: `user_id=eq.${user.id}` },
        () => fetchSpots(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchSpots])

  async function spot(ticker: string): Promise<SpotResult | null> {
    if (!user) return null
    const upper = ticker.toUpperCase()
    // Optimistic
    setSpottedTickers(prev => [...new Set([...prev, upper])])

    const rpcResult = await spotCreator(user.id, ticker).catch(() => null)
    if (rpcResult) {
      const { score } = getMomentum(ticker)
      const tier = getMomentumTier(score)
      logDiscoveryCard(user.id, ticker, rpcResult.spotterNumber, score, tier).catch(() => {})
      return {
        spotterNumber: rpcResult.spotterNumber,
        isRediscovery:  rpcResult.cardStatus === 'rediscovered',
      }
    }

    // RPC unavailable — direct insert fallback
    await logSpot(user.id, ticker).catch(() => {})
    return null
  }

  async function moveOn(ticker: string, durationDays: number): Promise<void> {
    if (!user) return
    // Optimistic
    setSpottedTickers(prev => prev.filter(t => t !== ticker.toUpperCase()))
    await archiveSpot(user.id, ticker, durationDays).catch(() => {})
    await moveOnCreator(user.id, ticker, durationDays).catch(() => {})
  }

  function isSpotted(ticker: string): boolean {
    return spottedTickers.includes(ticker.toUpperCase())
  }

  return { spottedTickers, loading, isSpotted, spot, moveOn, refetch: fetchSpots }
}
