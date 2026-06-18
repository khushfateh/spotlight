import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

export type Spot = {
  id: string
  userId: string
  creatorId: string
  notes: string | null
  spottedAt: string
}

export async function getUserSpots(userId: string): Promise<Spot[]> {
  if (!IS_SUPABASE_ENABLED) return []

  try {
    const { data, error } = await supabase!
      .from('spots')
      .select('id,user_id,creator_id,notes,spotted_at')
      .eq('user_id', userId)
      .order('spotted_at', { ascending: false })

    if (error || !data) return []

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      creatorId: row.creator_id,
      notes: row.notes,
      spottedAt: row.spotted_at,
    }))
  } catch {
    return []
  }
}

export async function addSpot(userId: string, creatorId: string, notes?: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { error } = await supabase!
      .from('spots')
      .insert({ user_id: userId, creator_id: creatorId, notes: notes ?? null })

    return !error
  } catch {
    return false
  }
}

export async function removeSpot(userId: string, creatorId: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { error } = await supabase!
      .from('spots')
      .delete()
      .eq('user_id', userId)
      .eq('creator_id', creatorId)

    return !error
  } catch {
    return false
  }
}

export async function hasSpotted(userId: string, creatorId: string): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { data, error } = await supabase!
      .from('spots')
      .select('id')
      .eq('user_id', userId)
      .eq('creator_id', creatorId)
      .maybeSingle()

    return !error && !!data
  } catch {
    return false
  }
}

export async function getSpottedCreatorIds(userId: string): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED) return []

  try {
    const { data, error } = await supabase!
      .from('spots')
      .select('creator_id')
      .eq('user_id', userId)

    if (error || !data) return []
    return data.map(row => row.creator_id)
  } catch {
    return []
  }
}

export async function getRediscoveredCreatorIds(userId: string): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_artist_spots')
      .select('creator_id')
      .eq('user_id', userId)
      .eq('has_rediscovered', true)

    if (error || !data) return []
    return data.map(row => row.creator_id as string)
  } catch {
    // Table may not exist yet (migration pending) — fail silently
    return []
  }
}
