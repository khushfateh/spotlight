import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

// Log a creator view (best-effort, non-blocking)
export async function logCreatorView(userId: string, ticker: string): Promise<void> {
  if (!IS_SUPABASE_ENABLED || !supabase) return
  try {
    await supabase.from('creator_views').insert({
      user_id: userId,
      ticker: ticker.toUpperCase(),
    })
  } catch {
    // Non-blocking — swallow errors
  }
}

// Log a search query (best-effort, non-blocking)
export async function logCreatorSearch(
  userId: string | null,
  query: string,
  resultTicker?: string
): Promise<void> {
  if (!IS_SUPABASE_ENABLED || !supabase) return
  try {
    await supabase.from('creator_searches').insert({
      user_id: userId ?? undefined,
      query,
      result_ticker: resultTicker?.toUpperCase() ?? null,
    })
  } catch {
    // Non-blocking
  }
}

// Fetch recently viewed tickers for a user (for taste profile in Supabase mode)
export async function getRecentlyViewedTickers(userId: string, limit = 20): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED || !supabase) return []
  try {
    const { data } = await supabase
      .from('creator_views')
      .select('ticker')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit)
    return data?.map((r: { ticker: string }) => r.ticker) ?? []
  } catch {
    return []
  }
}

// Fetch recent search terms for a user
export async function getRecentSearchTerms(userId: string, limit = 10): Promise<string[]> {
  if (!IS_SUPABASE_ENABLED || !supabase) return []
  try {
    const { data } = await supabase
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
