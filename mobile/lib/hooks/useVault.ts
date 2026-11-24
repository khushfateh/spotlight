import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useMomentum } from '@/context/MomentumContext'
import { supabase } from '@/lib/supabase'
import { getUserVaultCards, type VaultCard } from '@/lib/services/vaultService'

export type VaultEntry = {
  ticker:            string
  spotterRank:       number
  momentumAtSpot:    number
  spotDate:          Date
  currentScore:      number
  currentDelta:      number
  currentTier:       string
  isArchived:        boolean
  archivedAt:        Date | null
  spotDurationDays:  number | null
  rediscoveryCount:  number
  latestRespottedAt: Date | null
  isFoundingSpot:    boolean
  scoreIsLive:       boolean  // true when score comes from edge function, not static
}

export function useVault() {
  const { user, isAuthenticated } = useAuth()
  const { getScore } = useMomentum()
  const [cards,   setCards]   = useState<VaultCard[]>([])
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(false)

  function mapCard(c: VaultCard): VaultEntry {
    const live = getScore(c.ticker)
    return {
      ticker:            c.ticker,
      spotterRank:       c.spotterRank,
      momentumAtSpot:    c.momentumAtSpot,
      spotDate:          new Date(c.spottedAt),
      currentScore:      live.score,
      currentDelta:      live.delta,
      currentTier:       live.tier,
      isArchived:        c.spotStatus === 'archived' || !!c.movedOnAt,
      archivedAt:        c.movedOnAt ? new Date(c.movedOnAt) : null,
      spotDurationDays:  c.spotDurationDays,
      rediscoveryCount:  c.rediscoveryCount,
      latestRespottedAt: c.latestRespottedAt ? new Date(c.latestRespottedAt) : null,
      isFoundingSpot:    c.isFoundingSpot,
      scoreIsLive:       live.isLive,
    }
  }

  const fetchVault = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const fetched = await getUserVaultCards(user.id).catch(() => [])
    setCards(fetched)
    setLoading(false)
  }, [user])

  // Re-derive entries whenever cards or live scores change
  useEffect(() => {
    setEntries(cards.map(mapCard))
  }, [cards, getScore])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchVault()
    } else {
      setCards([])
      setEntries([])
    }
  }, [isAuthenticated, user])

  // Realtime: re-fetch on discovery_cards changes
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`vault:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discovery_cards', filter: `user_id=eq.${user.id}` },
        () => fetchVault(),
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'discovery_cards', filter: `user_id=eq.${user.id}` },
        () => fetchVault(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchVault])

  function getByTicker(ticker: string): VaultEntry | undefined {
    return entries.find(e => e.ticker === ticker.toUpperCase())
  }

  const activeEntries   = entries.filter(e => !e.isArchived)
  const archivedEntries = entries.filter(e => e.isArchived)

  return {
    entries,
    activeEntries,
    archivedEntries,
    loading,
    getByTicker,
    refetch: fetchVault,
  }
}
