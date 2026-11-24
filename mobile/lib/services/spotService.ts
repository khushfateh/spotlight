import { supabase } from '@/lib/supabase'

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function logSpot(userId: string, ticker: string): Promise<void> {
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const { error } = await supabase
    .from('spots')
    .insert({ user_id: userId, creator_id: creatorId })
  if (error && error.code !== '23505') {
    console.error('spotService.logSpot:', error.message)
  }
}

export async function archiveSpot(userId: string, ticker: string, durationDays: number): Promise<void> {
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const now = new Date().toISOString()
  await supabase
    .from('discovery_cards')
    .update({ moved_on_at: now, spot_duration_days: durationDays })
    .match({ user_id: userId, creator_id: creatorId })
  await supabase
    .from('discovery_cards')
    .update({ spot_status: 'archived' })
    .match({ user_id: userId, creator_id: creatorId })
  await supabase
    .from('discovery_cards')
    .update({ first_moved_on_at: now })
    .match({ user_id: userId, creator_id: creatorId })
    .is('first_moved_on_at', null)
  await supabase
    .from('spots')
    .update({ spot_status: 'archived' })
    .match({ user_id: userId, creator_id: creatorId })
  await supabase.from('spots').delete().match({ user_id: userId, creator_id: creatorId })
}

export async function getUserSpottedTickers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('creator_id')
    .eq('user_id', userId)
    .eq('spot_status', 'active')

  if (error) {
    // spot_status column may not exist yet — fall back without filter
    const { data: all } = await supabase
      .from('spots')
      .select('creator_id')
      .eq('user_id', userId)
    if (!all?.length) return []
    const ids = all.map((r: any) => r.creator_id)
    const { data: creators } = await supabase.from('creators').select('ticker').in('id', ids)
    return (creators as any[])?.map((c: any) => c.ticker).filter(Boolean) ?? []
  }

  if (!data?.length) return []
  const ids = data.map((r: any) => r.creator_id)
  const { data: creators } = await supabase.from('creators').select('ticker').in('id', ids)
  return (creators as any[])?.map((c: any) => c.ticker).filter(Boolean) ?? []
}
