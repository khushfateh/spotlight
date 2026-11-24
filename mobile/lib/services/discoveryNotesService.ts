import { supabase } from '@/lib/supabase'
import { getCreatorId } from './creatorIdService'

export type DiscoveryNote = {
  id:        string
  userId:    string
  username:  string | null
  note:      string
  createdAt: string
}

export async function getNotes(ticker: string, limit = 20): Promise<DiscoveryNote[]> {
  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return []

  // Step 1: fetch notes without join (FK may point to auth.users, not public.profiles)
  const { data, error } = await supabase
    .from('discovery_notes')
    .select('id, user_id, note, created_at')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return []

  // Step 2: batch-fetch usernames from public.profiles
  const userIds = [...new Set(data.map((r: { user_id: string }) => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)

  const usernameMap = new Map<string, string | null>(
    (profiles ?? []).map((p: { id: string; username: string | null }) => [p.id, p.username]),
  )

  return data.map((r: { id: string; user_id: string; note: string; created_at: string }) => ({
    id:        r.id,
    userId:    r.user_id,
    username:  usernameMap.get(r.user_id) ?? null,
    note:      r.note,
    createdAt: r.created_at,
  }))
}

export async function addNote(
  ticker:  string,
  userId:  string,
  note:    string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = note.trim()
  if (!clean || clean.length > 280) return { ok: false, error: 'Note must be 1–280 characters' }

  const creatorId = await getCreatorId(ticker)
  if (!creatorId) return { ok: false, error: 'Artist not found' }

  const { error } = await supabase.from('discovery_notes').insert({
    creator_id: creatorId,
    user_id:    userId,
    note:       clean,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('discovery_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)
  return !error
}
