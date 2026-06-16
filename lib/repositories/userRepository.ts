import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

export type UserProfile = {
  id: string
  email: string | null
  username: string | null
  fullName: string | null
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  coverColor: string
  discoveryScore: number
  creatorsSpotted: number
  breakoutsIdentified: number
  avgLeadDays: number
  momentumAccuracy: number
  discoveryRank: string
  onboardingComplete: boolean
}

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    username: (row.username as string | null) ?? null,
    fullName: (row.full_name as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    coverColor: (row.cover_color as string) ?? 'from-zinc-700 to-zinc-900',
    discoveryScore: (row.discovery_score as number) ?? 0,
    creatorsSpotted: (row.creators_spotted as number) ?? 0,
    breakoutsIdentified: (row.breakouts_identified as number) ?? 0,
    avgLeadDays: (row.avg_lead_days as number) ?? 0,
    momentumAccuracy: (row.momentum_accuracy as number) ?? 0,
    discoveryRank: (row.discovery_rank as string) ?? 'Newcomer',
    onboardingComplete: (row.onboarding_complete as boolean) ?? false,
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!IS_SUPABASE_ENABLED) return null

  try {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return rowToProfile(data as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    username: string
    displayName: string
    bio: string
    coverColor: string
  }>
): Promise<boolean> {
  if (!IS_SUPABASE_ENABLED) return false

  try {
    const { error } = await supabase!
      .from('profiles')
      .update({
        ...(updates.username !== undefined && { username: updates.username }),
        ...(updates.displayName !== undefined && { display_name: updates.displayName }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
        ...(updates.coverColor !== undefined && { cover_color: updates.coverColor }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return !error
  } catch {
    return false
  }
}
