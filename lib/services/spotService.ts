import { supabase } from '@/lib/supabase/client'
import { getCreatorByTicker } from '@/lib/mock-data/creators'

// Looks up creator ID in Supabase. If not found, auto-inserts from mock data
// so any creator present in the app always works regardless of which seed migrations ran.
async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  if (!supabase) return null

  const upper = ticker.toUpperCase()
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', upper)
    .single()

  if (data?.id) return data.id

  // Creator missing from DB — seed it from mock data so future ops succeed
  const mock = getCreatorByTicker(upper)
  if (!mock) return null

  const { data: inserted } = await supabase
    .from('creators')
    .insert({
      ticker: upper,
      slug: upper.toLowerCase(),
      name: mock.name,
      category: mock.category,
      bio: mock.bio ?? null,
      image_url: mock.imageUrl ?? null,
    })
    .select('id')
    .single()

  return inserted?.id ?? null
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

export async function archiveSpot(userId: string, ticker: string, durationDays: number): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const now = new Date().toISOString()
  // Set moved_on_at + spot_duration_days first (columns from 20260616 migration — always present).
  // These are split from spot_status so that a missing spot_status column (20260617 migration)
  // never blocks moved_on_at from being written. The vault fallback uses moved_on_at to
  // determine isArchived, so this must succeed even if spot_status doesn't exist yet.
  await supabase
    .from('discovery_cards')
    .update({ moved_on_at: now, spot_duration_days: durationDays })
    .match({ user_id: userId, creator_id: creatorId })
  // Set spot_status separately — safe to fail if column doesn't exist yet
  await supabase
    .from('discovery_cards')
    .update({ spot_status: 'archived' })
    .match({ user_id: userId, creator_id: creatorId })
  // Set first_moved_on_at only on the first move-on (never overwrite)
  await supabase
    .from('discovery_cards')
    .update({ first_moved_on_at: now })
    .match({ user_id: userId, creator_id: creatorId })
    .is('first_moved_on_at', null)
  // Mark spots as archived BEFORE deleting — triggers a realtime UPDATE event.
  // Supabase realtime DELETE events require REPLICA IDENTITY FULL to match column
  // filters; UPDATE events work reliably without it. The UPDATE fires, fetchSpots()
  // re-runs with the spot_status='active' filter, and the creator disappears from
  // "My Spots" immediately. The subsequent DELETE just cleans up the row.
  await supabase.from('spots').update({ spot_status: 'archived' }).match({ user_id: userId, creator_id: creatorId })
  await supabase.from('spots').delete().match({ user_id: userId, creator_id: creatorId })
  await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: 'move_on',
    creator_id: creatorId,
    metadata: { ticker, duration_days: durationDays },
  })
}

export async function rediscoverSpot(userId: string, ticker: string): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const now = new Date().toISOString()
  const { data: card } = await supabase
    .from('discovery_cards')
    .select('rediscovery_count')
    .match({ user_id: userId, creator_id: creatorId })
    .single()
  const nextCount = (card?.rediscovery_count ?? 0) + 1
  await supabase
    .from('discovery_cards')
    .update({ spot_status: 'active', latest_respotted_at: now, rediscovery_count: nextCount })
    .match({ user_id: userId, creator_id: creatorId })
  await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: 'rediscovered',
    creator_id: creatorId,
    metadata: { ticker, chapter: nextCount + 1 },
  })
}

export async function getUserSpottedTickers(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('spots')
    .select('creator_id')
    .eq('user_id', userId)
    .eq('spot_status', 'active')
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
