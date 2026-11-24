// Fire-and-forget signal logging. These feed the momentum engine.
// All calls are best-effort — never throw, never block UI.

import { supabase } from '@/lib/supabase'
import { getCreatorId } from './creatorIdService'

export async function logCreatorView(ticker: string, userId?: string | null): Promise<void> {
  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return
  try {
    await supabase.from('creator_views').insert({ creator_id: creatorId, user_id: userId ?? null })
  } catch {}
}

export async function logCreatorSearch(
  ticker: string,
  query:  string,
  userId?: string | null,
): Promise<void> {
  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return
  try {
    await supabase.from('creator_searches').insert({ creator_id: creatorId, user_id: userId ?? null, query })
  } catch {}
}
