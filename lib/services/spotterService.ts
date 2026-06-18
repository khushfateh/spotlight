import { supabase } from '@/lib/supabase/client'

export type CardStatus = 'active' | 'moved_on' | 'rediscovered'

export type SpotResult = {
  spotterNumber: number
  cardStatus: CardStatus
}

export type SpotRelationship = {
  id: string
  creatorId: string
  ticker: string
  name: string
  imageUrl: string | null
  spotterNumber: number
  firstSpottedAt: Date
  firstMovedOnAt: Date | null
  latestSpottedAt: Date
  latestMovedOnAt: Date | null
  isCurrentlySpotted: boolean
  hasEverMovedOn: boolean
  hasRediscovered: boolean
  rediscoveredAt: Date | null
  cardStatus: CardStatus
}

export type SpotCollection = {
  active: SpotRelationship[]
  movedOn: SpotRelationship[]
  rediscovered: SpotRelationship[]
}

const UAS_SELECT = `
  id, creator_id, spotter_number,
  first_spotted_at, first_moved_on_at, latest_spotted_at, latest_moved_on_at,
  is_currently_spotted, has_ever_moved_on, has_rediscovered, rediscovered_at,
  creators(ticker, name, image_url)
` as const

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .single()
  return (data as { id: string } | null)?.id ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): SpotRelationship {
  const creator = row.creators as { ticker: string; name: string; image_url: string | null } | null
  const isCurrentlySpotted = Boolean(row.is_currently_spotted)
  const hasRediscovered = Boolean(row.has_rediscovered)
  const cardStatus: CardStatus = !isCurrentlySpotted
    ? 'moved_on'
    : hasRediscovered
    ? 'rediscovered'
    : 'active'
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    ticker: creator?.ticker ?? '',
    name: creator?.name ?? '',
    imageUrl: creator?.image_url ?? null,
    spotterNumber: row.spotter_number as number,
    firstSpottedAt: new Date(row.first_spotted_at as string),
    firstMovedOnAt: row.first_moved_on_at ? new Date(row.first_moved_on_at as string) : null,
    latestSpottedAt: new Date(row.latest_spotted_at as string),
    latestMovedOnAt: row.latest_moved_on_at ? new Date(row.latest_moved_on_at as string) : null,
    isCurrentlySpotted,
    hasEverMovedOn: Boolean(row.has_ever_moved_on),
    hasRediscovered,
    rediscoveredAt: row.rediscovered_at ? new Date(row.rediscovered_at as string) : null,
    cardStatus,
  }
}

export async function spotCreator(userId: string, ticker: string): Promise<SpotResult | null> {
  if (!supabase) return null
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null
  const { data, error } = await supabase.rpc('spot_or_rediscover', {
    p_user_id: userId,
    p_creator_id: creatorId,
  })
  if (error) {
    console.error('spotterService.spotCreator:', error.message)
    return null
  }
  const result = data as { spotter_number: number; card_status: string }
  return {
    spotterNumber: result.spotter_number,
    cardStatus: result.card_status as CardStatus,
  }
}

export async function moveOnCreator(
  userId: string,
  ticker: string,
  durationDays: number,
): Promise<SpotResult | null> {
  if (!supabase) return null
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null
  const { data, error } = await supabase.rpc('move_on_creator', {
    p_user_id: userId,
    p_creator_id: creatorId,
    p_duration_days: durationDays,
  })
  if (error) {
    console.error('spotterService.moveOnCreator:', error.message)
    return null
  }
  const result = data as { spotter_number: number; card_status: string }
  return {
    spotterNumber: result.spotter_number,
    cardStatus: result.card_status as CardStatus,
  }
}

export async function getRelationship(
  userId: string,
  ticker: string,
): Promise<SpotRelationship | null> {
  if (!supabase) return null
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null
  const { data, error } = await supabase
    .from('user_artist_spots')
    .select(UAS_SELECT)
    .eq('user_id', userId)
    .eq('creator_id', creatorId)
    .single()
  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapRow(data as Record<string, any>)
}

export async function getUserCollection(userId: string): Promise<SpotCollection> {
  const empty: SpotCollection = { active: [], movedOn: [], rediscovered: [] }
  if (!supabase) return empty
  const { data, error } = await supabase
    .from('user_artist_spots')
    .select(UAS_SELECT)
    .eq('user_id', userId)
    .order('first_spotted_at', { ascending: false })
  if (error || !data) return empty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (data as Record<string, any>[]).map(mapRow)
  return {
    active: all.filter(r => r.isCurrentlySpotted && !r.hasRediscovered),
    movedOn: all.filter(r => !r.isCurrentlySpotted),
    rediscovered: all.filter(r => r.hasRediscovered),
  }
}
