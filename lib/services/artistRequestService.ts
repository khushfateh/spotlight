import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  sendRequestAcknowledgement,
  sendTeamArtistAlert,
  sendArtistApprovedEmail,
} from '@/lib/email'

export type ArtistRequestInput = {
  userId:          string
  userEmail:       string
  artistName:      string
  genre?:          string
  country?:        string
  spotifyUrl?:     string
  instagramHandle?: string
  youtubeUrl?:     string
  reason?:         string
}

export type ArtistRequestStatus = {
  alreadyRequested: boolean
  requestCount:     number
}

// Normalize artist name for deduplication (trim + collapse spaces)
function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export async function submitArtistRequest(input: ArtistRequestInput): Promise<{ ok: boolean; error?: string; count: number }> {
  if (!supabaseAdmin) return { ok: false, error: 'DB unavailable', count: 0 }

  const name = normalizeName(input.artistName)
  if (!name) return { ok: false, error: 'Artist name is required', count: 0 }

  // Insert — unique constraint (requested_by, lower(artist_name)) handles duplicates
  const { error: insertErr } = await supabaseAdmin.from('artist_requests').insert({
    requested_by:     input.userId,
    requester_email:  input.userEmail,
    artist_name:      name,
    genre:            input.genre   || null,
    country:          input.country || null,
    spotify_url:      input.spotifyUrl      || null,
    instagram_handle: input.instagramHandle || null,
    youtube_url:      input.youtubeUrl      || null,
    reason:           input.reason          || null,
    status:           'pending',
  })

  if (insertErr) {
    if (insertErr.message.includes('unique') || insertErr.code === '23505') {
      return { ok: false, error: 'already_requested', count: 0 }
    }
    console.error('[artistRequestService.submit]', insertErr.message)
    return { ok: false, error: insertErr.message, count: 0 }
  }

  // Count total pending requests for this artist
  const { count } = await supabaseAdmin
    .from('artist_requests')
    .select('*', { count: 'exact', head: true })
    .ilike('artist_name', name)
    .eq('status', 'pending')

  const total = count ?? 1

  // Send acknowledgement to requester
  await sendRequestAcknowledgement(input.userEmail, name, total)

  // If we just hit the threshold, fetch all requests and notify team
  if (total >= 5) {
    const { data: allRequests } = await supabaseAdmin
      .from('artist_requests')
      .select('requester_email, genre, spotify_url, reason')
      .ilike('artist_name', name)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (allRequests && allRequests.length > 0) {
      await sendTeamArtistAlert(name, total, allRequests)
    }
  }

  return { ok: true, count: total }
}

export async function getRequestStatus(userId: string, artistName: string): Promise<ArtistRequestStatus> {
  if (!supabaseAdmin) return { alreadyRequested: false, requestCount: 0 }

  const name = normalizeName(artistName)

  const [userRow, totalRow] = await Promise.all([
    supabaseAdmin
      .from('artist_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_by', userId)
      .ilike('artist_name', name)
      .single(),
    supabaseAdmin
      .from('artist_requests')
      .select('*', { count: 'exact', head: true })
      .ilike('artist_name', name)
      .eq('status', 'pending'),
  ])

  return {
    alreadyRequested: !userRow.error,
    requestCount:     totalRow.count ?? 0,
  }
}

// ── Admin: approve an artist request ──────────────────────────────────────────
// Called by POST /api/artist-requests/approve (protected by ADMIN_SECRET).
// Creates the creator stub and notifies all requesters.

const COVER_COLORS = [
  'from-purple-600 to-pink-600',
  'from-yellow-400 to-orange-500',
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-red-500 to-pink-600',
  'from-violet-600 to-purple-800',
  'from-amber-400 to-yellow-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-700',
  'from-green-500 to-emerald-700',
  'from-fuchsia-500 to-violet-600',
  'from-sky-500 to-cyan-600',
]

function pickColor(ticker: string): string {
  const hash = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0)
  return COVER_COLORS[hash % COVER_COLORS.length]
}

function toTicker(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
}

export async function approveArtistRequest(artistName: string, overrideTicker?: string): Promise<{ ok: boolean; ticker?: string; error?: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'DB unavailable' }

  const name   = normalizeName(artistName)
  const ticker = (overrideTicker ?? toTicker(name)) || toTicker(name)
  const slug   = ticker.toLowerCase()

  // Fetch all pending requests (sorted oldest-first → first row is founding requester)
  const { data: requests, error: fetchErr } = await supabaseAdmin
    .from('artist_requests')
    .select('id, requested_by, requester_email, genre, spotify_url')
    .ilike('artist_name', name)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (fetchErr || !requests?.length) {
    return { ok: false, error: fetchErr?.message ?? 'No pending requests found' }
  }

  const foundingRequesterId = requests[0].requested_by
  const genre    = requests[0].genre ?? 'Music'
  const spotifyUrl = requests.find(r => r.spotify_url)?.spotify_url ?? null

  // Insert creator stub
  const { data: creator, error: creatorErr } = await supabaseAdmin
    .from('creators')
    .insert({
      ticker,
      slug,
      name,
      category:               genre,
      bio:                    null,
      coverColor:             pickColor(ticker),
      creatorScore:           50,
      founding_requester_id:  foundingRequesterId,
      spotify_url:            spotifyUrl,
    })
    .select('id')
    .single()

  if (creatorErr) {
    console.error('[approveArtistRequest] creator insert:', creatorErr.message)
    return { ok: false, error: creatorErr.message }
  }

  // Insert artist_spot_counters row so spotter ranking works immediately
  await supabaseAdmin
    .from('artist_spot_counters')
    .insert({ creator_id: creator.id, next_spotter_number: 1, total_spotter_count: 0 })

  // Mark all requests as approved
  await supabaseAdmin
    .from('artist_requests')
    .update({ status: 'approved' })
    .ilike('artist_name', name)
    .eq('status', 'pending')

  // Email all requesters
  const emails = [...new Set(requests.map(r => r.requester_email))]
  await sendArtistApprovedEmail(emails, name, ticker)

  return { ok: true, ticker }
}
