'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserSpottedTickers, logSpot, removeSpot } from '@/lib/services/spotService'

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

  async function spot(ticker: string) {
    setSpottedTickers(prev => [...new Set([...prev, ticker.toUpperCase()])])
    if (isSupabaseMode && currentUser) {
      await logSpot(currentUser.id, ticker)
    }
  }

  async function unspot(ticker: string) {
    setSpottedTickers(prev => prev.filter(t => t !== ticker.toUpperCase()))
    if (isSupabaseMode && currentUser) {
      await removeSpot(currentUser.id, ticker)
    }
  }

  function isSpotted(ticker: string) {
    return spottedTickers.includes(ticker.toUpperCase())
  }

  return { spottedTickers, loading, spot, unspot, isSpotted, refetch: fetchSpots }
}
