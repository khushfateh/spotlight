import { supabase } from '@/lib/supabase/client'
import type { SupabaseActivity, Json } from '@/lib/supabase/types'

export async function logActivity(
  userId: string,
  activityType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: activityType,
    metadata: metadata as Json,
  })
  if (error) console.error('activityService.logActivity:', error.message)
}

export async function getUserActivity(
  userId: string,
  limit = 20
): Promise<SupabaseActivity[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}
