import { supabase } from '@/lib/supabase'
import { getCreatorId } from './creatorIdService'

export type VoteType = 'will_break_out' | 'under_the_radar' | 'already_peaking' | 'needs_more_time'

export type PulseVote = {
  type:  VoteType
  count: number
  pct:   number  // 0-100
}

export type PulseData = {
  votes:        PulseVote[]
  total:        number
  userVoteType: VoteType | null
}

export const VOTE_META: Record<VoteType, { label: string; symbol: string; color: string }> = {
  will_break_out:  { label: 'Breaking Out',   symbol: '◆', color: '#fb923c' },
  under_the_radar: { label: 'Under the Radar', symbol: '◇', color: '#60a5fa' },
  already_peaking: { label: 'Already Peaked',  symbol: '◈', color: '#a78bfa' },
  needs_more_time: { label: 'Needs More Time', symbol: '◉', color: '#52d78a' },
}

export async function getPulse(ticker: string, userId?: string | null): Promise<PulseData> {
  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return { votes: [], total: 0, userVoteType: null }

  const { data } = await supabase
    .from('creator_pulse_votes')
    .select('vote_type, user_id')
    .eq('creator_id', creatorId)

  const rows = (data ?? []) as { vote_type: string; user_id: string }[]
  const total = rows.length
  const counts = new Map<VoteType, number>()
  let userVoteType: VoteType | null = null

  for (const row of rows) {
    const t = row.vote_type as VoteType
    counts.set(t, (counts.get(t) ?? 0) + 1)
    if (userId && row.user_id === userId) userVoteType = t
  }

  const voteTypes: VoteType[] = ['will_break_out', 'under_the_radar', 'already_peaking', 'needs_more_time']
  const votes: PulseVote[] = voteTypes.map(type => ({
    type,
    count: counts.get(type) ?? 0,
    pct:   total > 0 ? Math.round(((counts.get(type) ?? 0) / total) * 100) : 0,
  }))

  return { votes, total, userVoteType }
}

export async function castVote(
  ticker: string,
  userId: string,
  voteType: VoteType,
): Promise<void> {
  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return

  await supabase.from('creator_pulse_votes').upsert(
    { creator_id: creatorId, user_id: userId, vote_type: voteType, voted_at: new Date().toISOString() },
    { onConflict: 'user_id,creator_id' },
  )
}
