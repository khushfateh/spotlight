import { supabase } from '@/lib/supabase/client'

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .single()
  return data?.id ?? null
}

export async function logDiscoveryCard(
  userId: string,
  ticker: string,
  spotterRank: number,
  momentumAtSpot: number,
  momentumTier: string,
): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const { error } = await supabase.from('discovery_cards').upsert(
    {
      user_id: userId,
      creator_id: creatorId,
      spotter_rank: spotterRank,
      momentum_at_spot: momentumAtSpot,
      momentum_tier: momentumTier,
    },
    { onConflict: 'user_id,creator_id', ignoreDuplicates: true },
  )
  if (error) console.error('vaultService.logDiscoveryCard:', error.message)
}

export type VaultCard = {
  ticker: string
  spotterRank: number
  momentumAtSpot: number
  momentumTier: string
  spottedAt: string
  movedOnAt: string | null
  spotDurationDays: number | null
  spotStatus: string
  firstSpottedAt: string | null
  firstMovedOnAt: string | null
  latestRespottedAt: string | null
  rediscoveryCount: number
}

export async function getUserVaultCards(userId: string): Promise<VaultCard[]> {
  if (!supabase) return []

  // Try extended query (requires 20260617_rediscovery migration)
  const { data, error } = await supabase
    .from('discovery_cards')
    .select(`
      spotter_rank, momentum_at_spot, momentum_tier, spotted_at,
      moved_on_at, spot_duration_days, spot_status,
      first_spotted_at, first_moved_on_at, latest_respotted_at, rediscovery_count,
      creators(ticker)
    `)
    .eq('user_id', userId)
    .order('spotted_at', { ascending: false })

  if (error) {
    // Migration not yet run — fall back to pre-migration columns only
    const { data: base, error: baseErr } = await supabase
      .from('discovery_cards')
      .select('spotter_rank, momentum_at_spot, momentum_tier, spotted_at, moved_on_at, spot_duration_days, creators(ticker)')
      .eq('user_id', userId)
      .order('spotted_at', { ascending: false })
    if (baseErr || !base) return []
    return base
      .filter(row => row.creators && (row.creators as unknown as { ticker: string }).ticker)
      .map(row => ({
        ticker: (row.creators as unknown as { ticker: string }).ticker.toUpperCase(),
        spotterRank: row.spotter_rank,
        momentumAtSpot: row.momentum_at_spot,
        momentumTier: row.momentum_tier,
        spottedAt: row.spotted_at,
        movedOnAt: row.moved_on_at ?? null,
        spotDurationDays: row.spot_duration_days ?? null,
        spotStatus: row.moved_on_at ? 'archived' : 'active',
        firstSpottedAt: null,
        firstMovedOnAt: null,
        latestRespottedAt: null,
        rediscoveryCount: 0,
      }))
  }

  if (!data) return []
  return data
    .filter(row => row.creators && (row.creators as unknown as { ticker: string }).ticker)
    .map(row => ({
      ticker: (row.creators as unknown as { ticker: string }).ticker.toUpperCase(),
      spotterRank: row.spotter_rank,
      momentumAtSpot: row.momentum_at_spot,
      momentumTier: row.momentum_tier,
      spottedAt: row.spotted_at,
      movedOnAt: row.moved_on_at ?? null,
      spotDurationDays: row.spot_duration_days ?? null,
      spotStatus: row.spot_status ?? 'active',
      firstSpottedAt: row.first_spotted_at ?? null,
      firstMovedOnAt: row.first_moved_on_at ?? null,
      latestRespottedAt: row.latest_respotted_at ?? null,
      rediscoveryCount: row.rediscovery_count ?? 0,
    }))
}
