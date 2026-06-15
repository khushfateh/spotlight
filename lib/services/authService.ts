import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import type { SupabaseProfile } from '@/lib/supabase/types'
import type { MockUser } from '@/lib/mock-data/users'

export interface AuthResult {
  error?: string
  needsOnboarding?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function profileToMockUser(profile: SupabaseProfile, email: string): MockUser {
  const displayName = profile.display_name || profile.full_name || email.split('@')[0]
  return {
    id: profile.id,
    name: displayName,
    username: `@${profile.username || profile.id.slice(0, 8)}`,
    initials: getInitials(displayName),
    avatar: profile.avatar_url || '👤',
    bio: profile.bio || '',
    interests: [],
    spottedTickers: [],
    discoveryScore: profile.discovery_score,
    creatorsSpotted: profile.creators_spotted,
    breakoutsIdentified: profile.breakouts_identified,
    avgLeadDays: profile.avg_lead_days,
    momentumAccuracy: profile.momentum_accuracy,
    discoveryRank: profile.discovery_rank,
    badges: [],
    joinedDaysAgo: Math.floor(
      (Date.parse(new Date().toISOString()) - Date.parse(profile.created_at)) / 86400000
    ),
    coverColor: profile.cover_color,
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { error: 'Supabase not configured' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return {}
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  if (!supabase) return { error: 'Supabase not configured' }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  })
  if (error) return { error: error.message }
  return { needsOnboarding: true }
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export { IS_SUPABASE_ENABLED }
