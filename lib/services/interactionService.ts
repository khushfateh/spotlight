import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

async function resolveCreatorId(ticker: string): Promise<string | null> {
  if (!supabase) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function logCreatorView(userId: string, ticker: string): Promise<void> {
  if (!IS_SUPABASE_ENABLED || !supabase) return
  try {
    const creatorId = await resolveCreatorId(ticker)
    if (!creatorId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('creator_views').insert({ creator_id: creatorId, user_id: userId })
  } catch {
    // non-blocking
  }
}

export async function logCreatorSearch(
  userId: string | null,
  query: string,
  resultTicker?: string,
): Promise<void> {
  if (!IS_SUPABASE_ENABLED || !supabase) return
  try {
    let creatorId: string | null = null
    if (resultTicker) creatorId = await resolveCreatorId(resultTicker)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('creator_searches').insert({
      ...(creatorId ? { creator_id: creatorId } : {}),
      ...(userId ? { user_id: userId } : {}),
      query,
    })
  } catch {
    // non-blocking
  }
}

export async function getRecentlyViewedTickers(userId: string, limit = 20): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED || !supabase) return []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('creator_views')
      .select('creators(ticker)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit)
    return (data ?? [])
      .map((r: { creators: { ticker: string } | null }) => r.creators?.ticker ?? '')
      .filter(Boolean)
  } catch {
    return []
  }
}

export async function getRecentSearchTerms(userId: string, limit = 10): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED || !supabase) return []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('creator_searches')
      .select('query')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit)
    return data?.map((r: { query: string }) => r.query) ?? []
  } catch {
    return []
  }
}
