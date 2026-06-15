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

export async function followCreator(userId: string, ticker: string): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: userId, creator_id: creatorId })
  if (error && error.code !== '23505') {
    console.error('followService.followCreator:', error.message)
  }
}

export async function unfollowCreator(userId: string, ticker: string): Promise<void> {
  if (!supabase) return
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return
  await supabase
    .from('follows')
    .delete()
    .match({ follower_id: userId, creator_id: creatorId })
}

export async function getFollowedTickers(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('creator_id')
    .eq('follower_id', userId)
    .not('creator_id', 'is', null)
  if (error || !data || data.length === 0) return []

  const creatorIds = data.map(r => r.creator_id).filter(Boolean) as string[]
  const { data: creators } = await supabase
    .from('creators')
    .select('ticker')
    .in('id', creatorIds)
  return creators?.map(c => c.ticker).filter(Boolean) ?? []
}

export async function isFollowing(userId: string, ticker: string): Promise<boolean> {
  const followed = await getFollowedTickers(userId)
  return followed.includes(ticker.toUpperCase())
}
