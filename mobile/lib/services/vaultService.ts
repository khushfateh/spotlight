import { supabase } from '@/lib/supabase'

async function getCreatorMeta(ticker: string): Promise<{ id: string; founding_requester_id: string | null } | null> {
  const { data } = await (supabase.from('creators') as any)
    .select('id, founding_requester_id')
    .eq('ticker', ticker.toUpperCase())
    .maybeSingle()
  return data ?? null
}

export async function logDiscoveryCard(
  userId: string,
  ticker: string,
  spotterRank: number,
  momentumAtSpot: number,
  momentumTier: string,
): Promise<void> {
  const creator = await getCreatorMeta(ticker)
  if (!creator) return
  const isFoundingSpot = creator.founding_requester_id === userId
  const { error } = await (supabase.from('discovery_cards') as any).upsert(
    {
      user_id:          userId,
      creator_id:       creator.id,
      spotter_rank:     spotterRank,
      momentum_at_spot: momentumAtSpot,
      momentum_tier:    momentumTier,
      is_founding_spot: isFoundingSpot,
    },
    { onConflict: 'user_id,creator_id', ignoreDuplicates: true },
  )
  if (error) console.error('vaultService.logDiscoveryCard:', error.message)
}

export type VaultCard = {
  ticker:            string
  spotterRank:       number
  momentumAtSpot:    number
  momentumTier:      string
  spottedAt:         string
  movedOnAt:         string | null
  spotDurationDays:  number | null
  spotStatus:        string
  firstMovedOnAt:    string | null
  latestRespottedAt: string | null
  rediscoveryCount:  number
  isFoundingSpot:    boolean
}

export async function getUserVaultCards(userId: string): Promise<VaultCard[]> {
  const { data, error } = await (supabase.from('discovery_cards') as any)
    .select(`
      spotter_rank, momentum_at_spot, momentum_tier, spotted_at,
      moved_on_at, spot_duration_days, spot_status,
      first_moved_on_at, latest_respotted_at, rediscovery_count,
      is_founding_spot,
      creators(ticker)
    `)
    .eq('user_id', userId)
    .order('spotted_at', { ascending: false })

  if (error) {
    // Migration not yet applied — base columns only
    const { data: base } = await supabase
      .from('discovery_cards')
      .select('spotter_rank, momentum_at_spot, momentum_tier, spotted_at, moved_on_at, spot_duration_days, creators(ticker)')
      .eq('user_id', userId)
      .order('spotted_at', { ascending: false })
    if (!base) return []
    return (base as any[])
      .filter((r: any) => r.creators?.ticker)
      .map((r: any): VaultCard => ({
        ticker:            r.creators.ticker.toUpperCase(),
        spotterRank:       r.spotter_rank,
        momentumAtSpot:    r.momentum_at_spot,
        momentumTier:      r.momentum_tier,
        spottedAt:         r.spotted_at,
        movedOnAt:         r.moved_on_at ?? null,
        spotDurationDays:  r.spot_duration_days ?? null,
        spotStatus:        r.moved_on_at ? 'archived' : 'active',
        firstMovedOnAt:    null,
        latestRespottedAt: null,
        rediscoveryCount:  0,
        isFoundingSpot:    false,
      }))
  }

  if (!data) return []
  return (data as any[])
    .filter((r: any) => r.creators?.ticker)
    .map((r: any): VaultCard => ({
      ticker:            r.creators.ticker.toUpperCase(),
      spotterRank:       r.spotter_rank,
      momentumAtSpot:    r.momentum_at_spot,
      momentumTier:      r.momentum_tier,
      spottedAt:         r.spotted_at,
      movedOnAt:         r.moved_on_at ?? null,
      spotDurationDays:  r.spot_duration_days ?? null,
      spotStatus:        r.spot_status ?? 'active',
      firstMovedOnAt:    r.first_moved_on_at ?? null,
      latestRespottedAt: r.latest_respotted_at ?? null,
      rediscoveryCount:  r.rediscovery_count ?? 0,
      isFoundingSpot:    r.is_founding_spot ?? false,
    }))
}
