import { supabase } from '@/lib/supabase'

// Session-scoped cache: ticker → creator UUID
let cache: Map<string, string> | null = null
let fetching: Promise<void> | null = null

async function ensureCache(): Promise<void> {
  if (cache) return
  if (fetching) return fetching

  fetching = (async () => {
    const { data } = await supabase.from('creators').select('id, ticker')
    cache = new Map(
      (data ?? []).map((r: { id: string; ticker: string }) => [r.ticker.toUpperCase(), r.id]),
    )
  })().finally(() => { fetching = null })

  return fetching
}

export async function getCreatorId(ticker: string): Promise<string | null> {
  await ensureCache()
  return cache?.get(ticker.toUpperCase()) ?? null
}

export async function getCreatorIdMap(): Promise<Map<string, string>> {
  await ensureCache()
  return cache ?? new Map()
}
