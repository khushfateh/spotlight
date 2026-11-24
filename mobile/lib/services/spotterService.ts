import { supabase } from '@/lib/supabase'

export type SpotResult = {
  spotterNumber: number
  cardStatus: 'active' | 'moved_on' | 'rediscovered'
}

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .single()
  return (data as { id: string } | null)?.id ?? null
}

export async function spotCreator(userId: string, ticker: string): Promise<SpotResult | null> {
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null
  const { data, error } = await supabase.rpc('spot_or_rediscover', {
    p_user_id:    userId,
    p_creator_id: creatorId,
  })
  if (error) {
    console.error('spotterService.spotCreator:', error.message)
    return null
  }
  const result = data as { spotter_number: number; card_status: string }
  return {
    spotterNumber: result.spotter_number,
    cardStatus:    result.card_status as SpotResult['cardStatus'],
  }
}

export async function moveOnCreator(
  userId: string,
  ticker: string,
  durationDays: number,
): Promise<SpotResult | null> {
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null
  const { data, error } = await supabase.rpc('move_on_creator', {
    p_user_id:       userId,
    p_creator_id:    creatorId,
    p_duration_days: durationDays,
  })
  if (error) {
    console.error('spotterService.moveOnCreator:', error.message)
    return null
  }
  const result = data as { spotter_number: number; card_status: string }
  return {
    spotterNumber: result.spotter_number,
    cardStatus:    result.card_status as SpotResult['cardStatus'],
  }
}

export async function getSpotterCount(ticker: string): Promise<number> {
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return 0
  const { count } = await supabase
    .from('spots')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
  return count ?? 0
}
