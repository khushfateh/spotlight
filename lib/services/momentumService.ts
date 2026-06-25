import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateAllMomentum } from '@/lib/momentum/MomentumEngine'
import type { MomentumScore } from '@/lib/momentum/types'

/**
 * Returns all creators' momentum scores sorted by score descending.
 * Returns an empty array when supabaseAdmin is unavailable (e.g. missing env vars).
 */
export async function getMomentumRanking(): Promise<MomentumScore[]> {
  if (!supabaseAdmin) return []
  const scores = await calculateAllMomentum(supabaseAdmin)
  return scores.sort((a, b) => b.score - a.score)
}
