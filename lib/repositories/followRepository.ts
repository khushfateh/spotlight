import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

export async function getFollowedCreatorIds(userId: string): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED) return []

  try {
    const { data, error } = await supabase!
      .from('follows')
      .select('creator_id')
      .eq('follower_id', userId)
      .not('creator_id', 'is', null)

    if (error || !data) return []
    return data.map(row => row.creator_id as string).filter(Boolean)
  } catch {
    return []
  }
}

export async function followCreator(userId: string, creatorId: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { error } = await supabase!
      .from('follows')
      .insert({ follower_id: userId, creator_id: creatorId })

    return !error
  } catch {
    return false
  }
}

export async function unfollowCreator(userId: string, creatorId: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { error } = await supabase!
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('creator_id', creatorId)

    return !error
  } catch {
    return false
  }
}

export async function isFollowingCreator(userId: string, creatorId: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { data, error } = await supabase!
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('creator_id', creatorId)
      .maybeSingle()

    return !error && !!data
  } catch {
    return false
  }
}
