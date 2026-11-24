import { supabase } from '@/lib/supabase'

export type Profile = {
  id:                   string
  username:             string | null
  full_name:            string | null
  display_name:         string | null
  bio:                  string | null
  avatar_url:           string | null
  discovery_score:      number
  creators_spotted:     number
  breakouts_identified: number
  discovery_rank:       string
  onboarding_complete:  boolean
  profile_completed:    boolean
  created_at:           string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,full_name,display_name,bio,avatar_url,discovery_score,creators_spotted,breakouts_identified,discovery_rank,onboarding_complete,profile_completed,created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data as Profile | null
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,full_name,display_name,bio,avatar_url,discovery_score,creators_spotted,breakouts_identified,discovery_rank,onboarding_complete,profile_completed,created_at')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (error) return null
  return data as Profile | null
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id,username,full_name,display_name,bio,avatar_url,discovery_score,creators_spotted,breakouts_identified,discovery_rank,onboarding_complete,profile_completed,created_at')
    .single()
  if (error) return null
  return data as Profile | null
}

export async function completeOnboarding(
  userId: string,
  username: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = username.trim().toLowerCase()

  // Validate format
  if (!/^[a-z0-9]([a-z0-9_]*[a-z0-9])?$/.test(clean) || clean.length < 3 || clean.length > 20) {
    return { ok: false, error: '3–20 chars, letters/digits/underscores only' }
  }
  if (clean.includes('__')) {
    return { ok: false, error: 'No consecutive underscores' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      onboarding_complete: true,
      profile_completed:   true,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Username already taken' }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle()
  return !data
}

export async function getBestSpotterRank(userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('user_artist_spots')
    .select('spotter_number')
    .eq('user_id', userId)
    .order('spotter_number', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as { spotter_number: number } | null)?.spotter_number ?? null
}
