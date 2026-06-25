import { supabase } from '@/lib/supabase/client'

const ANON_KEY = 'spotlight_anon_id'

function getAnonId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const existing = localStorage.getItem(ANON_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(ANON_KEY, id)
  return id
}

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('ticker', ticker.toUpperCase())
    .single()
  return (data as { id: string } | null)?.id ?? null
}

export async function trackAnonymousSpotAttempt(
  ticker: string,
  sourcePage: string,
): Promise<void> {
  if (!supabase) return
  const [creatorId, anonId] = await Promise.all([
    getCreatorIdByTicker(ticker),
    Promise.resolve(getAnonId()),
  ])
  const deviceType =
    typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
      ? 'mobile'
      : 'desktop'
  // Table may not be in generated types yet — cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('anonymous_spot_attempts')
    .insert({
      anonymous_session_id: anonId,
      creator_id: creatorId,
      attempted_at: new Date().toISOString(),
      source_page: sourcePage,
      device_type: deviceType,
    })
    .then(() => {}, () => {})
}
