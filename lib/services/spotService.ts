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

async function getTickerByCreatorId(creatorId: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('creators')
    .select('ticker')
    .eq('id', creatorId)
    .single()
  return data?.ticker ?? null
}

export async function logSpot(userId: string, ticker: string): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) {
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'spot',
      metadata: { ticker, source: 'unresolved' },
    })
    return
  }
  const { error } = await supabase
    .from('spots')
    .insert({ user_id: userId, creator_id: creatorId })
  if (error && error.code !== '23505') {
    console.error('spotService.logSpot:', error.message)
    return
  }
  await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: 'spot',
    creator_id: creatorId,
    metadata: { ticker },
  })
}

export async function removeSpot(userId: string, ticker: string): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  await supabase.from('spots').delete().match({ user_id: userId, creator_id: creatorId })
  await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: 'unspot',
    creator_id: creatorId,
    metadata: { ticker },
  })
}

export async function getUserSpottedTickers(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('spots')
    .select('creator_id')
    .eq('user_id', userId)
  if (error || !data || data.length === 0) return []

  const creatorIds = data.map(r => r.creator_id)
  const { data: creators } = await supabase
    .from('creators')
    .select('ticker')
    .in('id', creatorIds)
  return creators?.map(c => c.ticker).filter(Boolean) ?? []
}

export async function isSpotted(userId: string, ticker: string): Promise<boolean> {
  const tickers = await getUserSpottedTickers(userId)
  return tickers.includes(ticker.toUpperCase())
}

export async function getCreatorSpotCount(ticker: string): Promise<number> {
  if (!supabase) return 0
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return 0
  const { count } = await supabase
    .from('spots')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
  return count ?? 0
}
