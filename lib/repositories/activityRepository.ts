import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

export type ActivityType =
  | 'creator_view'
  | 'creator_spot'
  | 'creator_follow'
  | 'genre_follow'
  | 'search'

export async function logActivity(
  userId: string,
  activityType: ActivityType,
  payload: {
    creatorId?: string
    targetUserId?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  if (!IS_SUPABASE_ENABLED) return

  try {
    await supabase!.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      creator_id: payload.creatorId ?? null,
      target_user_id: payload.targetUserId ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: (payload.metadata ?? {}) as any,
    })
  } catch {
    // Non-critical — never throw
  }
}

export async function logCreatorView(userId: string, ticker: string): Promise<void> {
  if (!IS_SUPABASE_ENABLED) return

  try {
    await supabase!.from('creator_views').insert({ user_id: userId, ticker })
  } catch {
    // Non-critical
  }
}

export async function getRecentlyViewedTickers(userId: string, limit = 10): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED) return []

  try {
    const { data, error } = await supabase!
      .from('creator_views')
      .select('ticker,viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    // Deduplicate while preserving order
    const seen = new Set<string>()
    return data.map(r => r.ticker).filter(t => {
      if (seen.has(t)) return false
      seen.add(t)
      return true
    })
  } catch {
    return []
  }
}
