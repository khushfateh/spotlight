'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserVaultCards } from '@/lib/services/vaultService'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { supabase } from '@/lib/supabase/client'

export type VaultEntry = {
  ticker: string
  spotterRank: number
  momentumAtSpot: number
  spotDate: Date
  currentScore: number
  currentDelta: number
  currentTier: string
  isArchived: boolean
  archivedAt: Date | null
  spotDurationDays: number | null
  rediscoveryCount: number
  latestRespottedAt: Date | null
  firstMovedOnAt: Date | null
}

export function useVault() {
  const { currentUser, isSupabaseMode } = useAuth()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVault = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const cards = await getUserVaultCards(currentUser.id)
    const mapped: VaultEntry[] = cards.map(c => {
      const { score, delta } = getMomentum(c.ticker)
      return {
        ticker: c.ticker,
        spotterRank: c.spotterRank,
        momentumAtSpot: c.momentumAtSpot,
        spotDate: new Date(c.spottedAt),
        currentScore: score,
        currentDelta: delta,
        currentTier: getMomentumTier(score),
        isArchived: c.spotStatus === 'archived',
        archivedAt: c.movedOnAt ? new Date(c.movedOnAt) : null,
        spotDurationDays: c.spotDurationDays,
        rediscoveryCount: c.rediscoveryCount,
        latestRespottedAt: c.latestRespottedAt ? new Date(c.latestRespottedAt) : null,
        firstMovedOnAt: c.firstMovedOnAt ? new Date(c.firstMovedOnAt) : null,
      }
    })
    setEntries(mapped)
    setLoading(false)
  }, [isSupabaseMode, currentUser])

  useEffect(() => {
    if (isSupabaseMode) {
      fetchVault()
    } else {
      setEntries([])
    }
  }, [isSupabaseMode, currentUser, fetchVault])

  // Realtime: refetch when discovery cards are inserted or updated (rediscovery sets spot_status)
  useEffect(() => {
    if (!isSupabaseMode || !currentUser || !supabase) return
    const sb = supabase
    const channel = sb
      .channel(`vault:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discovery_cards', filter: `user_id=eq.${currentUser.id}` },
        () => { fetchVault() },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'discovery_cards', filter: `user_id=eq.${currentUser.id}` },
        () => { fetchVault() },
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [isSupabaseMode, currentUser, fetchVault])

  function getByTicker(ticker: string): VaultEntry | undefined {
    return entries.find(e => e.ticker === ticker.toUpperCase())
  }

  return { entries, loading, getByTicker, refetch: fetchVault }
}
