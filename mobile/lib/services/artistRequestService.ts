import { supabase } from '@/lib/supabase'

export type ArtistRequestInput = {
  userId:    string
  userEmail: string
  name:      string
  genre?:    string
  reason?:   string
}

export async function submitArtistRequest(
  input: ArtistRequestInput,
): Promise<{ ok: boolean; error?: string }> {
  const artistName = input.name.trim().replace(/\s+/g, ' ')
  if (!artistName) return { ok: false, error: 'Artist name is required' }

  const { error } = await supabase.from('artist_requests').insert({
    requested_by:    input.userId,
    requester_email: input.userEmail,
    artist_name:     artistName,
    genre:           input.genre   || null,
    reason:          input.reason  || null,
    status:          'pending',
  })

  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      return { ok: false, error: 'already_requested' }
    }
    console.error('artistRequestService:', error.message)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
