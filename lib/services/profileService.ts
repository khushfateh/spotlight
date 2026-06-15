import { supabase } from '@/lib/supabase/client'
import type { SupabaseProfile } from '@/lib/supabase/types'

export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('profileService.getProfile:', error.message)
    return null
  }
  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<SupabaseProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<SupabaseProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) {
    console.error('profileService.updateProfile:', error.message)
    return null
  }
  return data
}

export async function ensureProfile(
  userId: string,
  email: string,
  name?: string
): Promise<SupabaseProfile | null> {
  if (!supabase) return null
  const existing = await getProfile(userId)
  if (existing) return existing
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, email, full_name: name, display_name: name })
    .select()
    .single()
  if (error) {
    console.error('profileService.ensureProfile:', error.message)
    return null
  }
  return data
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await updateProfile(userId, { onboarding_complete: true })
}
