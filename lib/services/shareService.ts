import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'

export type ShareType = 'first_spot' | 'rediscovered' | 'discovery_record' | 'breakout_legacy'

export type ShareCardMetadata = {
  creatorName: string
  creatorTicker: string
  creatorCategory: string
  creatorImageUrl?: string
  coverColor: string
  spotterRank: number
  score: number
  tier: string
  spotDate: string   // ISO string
  userName: string
  breakoutDays?: number
  rediscoveryCount?: number
}

export type ShareCard = {
  id: string
  shareSlug: string
  userId: string
  shareType: ShareType
  title: string
  subtitle: string
  caption: string
  metadata: ShareCardMetadata
  createdAt: string
  viewCount: number
}

async function getCreatorIdByTicker(ticker: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('creators').select('id').eq('ticker', ticker.toUpperCase()).single()
  return (data as { id: string } | null)?.id ?? null
}

export function getShareUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '')
  return `${base}/share/${slug}`
}

export function buildShareTexts(shareType: ShareType, creatorName: string, userName: string) {
  const first = userName.split(' ')[0]
  switch (shareType) {
    case 'first_spot':
      return {
        title: `${first.toUpperCase()} SPOTTED`,
        subtitle: 'I spotted this before the crowd.',
        caption: `${first} spotted ${creatorName} on SPOTLIGHT — discover future icons before everyone else.`,
      }
    case 'rediscovered':
      return {
        title: `${first.toUpperCase()} REDISCOVERED`,
        subtitle: 'Some discoveries are worth revisiting.',
        caption: `${first} rediscovered ${creatorName} on SPOTLIGHT.`,
      }
    case 'discovery_record':
      return {
        title: `${first.toUpperCase()}'S DISCOVERY RECORD`,
        subtitle: 'From my SPOTLIGHT Vault.',
        caption: `${first}'s discovery of ${creatorName}, now in the SPOTLIGHT Vault.`,
      }
    case 'breakout_legacy':
      return {
        title: `${first.toUpperCase()} SPOTTED EARLY`,
        subtitle: 'Culture remembers who saw it first.',
        caption: `${first} spotted ${creatorName} before the breakout.`,
      }
  }
}

export async function createShareCard(
  userId: string,
  ticker: string,
  shareType: ShareType,
  metadata: ShareCardMetadata,
): Promise<ShareCard | null> {
  if (!supabase) return null
  const creatorId = await getCreatorIdByTicker(ticker)
  if (!creatorId) return null

  const texts = buildShareTexts(shareType, metadata.creatorName, metadata.userName)

  const { data, error } = await supabase
    .from('share_cards')
    .insert({
      user_id: userId,
      creator_id: creatorId,
      share_type: shareType,
      title: texts.title,
      subtitle: texts.subtitle,
      caption: texts.caption,
      metadata: metadata as unknown as Json,
    })
    .select('id, share_slug, user_id, share_type, title, subtitle, caption, metadata, created_at, view_count')
    .single()

  if (error || !data) {
    console.error('shareService.createShareCard:', error?.message)
    return null
  }

  const row = data as {
    id: string; share_slug: string; user_id: string; share_type: string;
    title: string; subtitle: string; caption: string; metadata: unknown;
    created_at: string; view_count: number;
  }

  return {
    id: row.id,
    shareSlug: row.share_slug,
    userId: row.user_id,
    shareType: row.share_type as ShareType,
    title: row.title,
    subtitle: row.subtitle,
    caption: row.caption,
    metadata: row.metadata as ShareCardMetadata,
    createdAt: row.created_at,
    viewCount: row.view_count,
  }
}

export async function getShareCardBySlug(slug: string): Promise<ShareCard | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('share_cards')
    .select('id, share_slug, user_id, share_type, title, subtitle, caption, metadata, created_at, view_count')
    .eq('share_slug', slug)
    .single()

  if (error || !data) return null

  const row = data as {
    id: string; share_slug: string; user_id: string; share_type: string;
    title: string; subtitle: string; caption: string; metadata: unknown;
    created_at: string; view_count: number;
  }

  return {
    id: row.id,
    shareSlug: row.share_slug,
    userId: row.user_id,
    shareType: row.share_type as ShareType,
    title: row.title,
    subtitle: row.subtitle,
    caption: row.caption,
    metadata: row.metadata as ShareCardMetadata,
    createdAt: row.created_at,
    viewCount: row.view_count,
  }
}

export async function incrementShareView(slug: string): Promise<void> {
  if (!supabase) return
  try { await supabase.rpc('increment_share_view', { p_slug: slug }) } catch { /* fire and forget */ }
}

export async function trackShareEvent(shareCardId: string, eventType: string): Promise<void> {
  if (!supabase) return
  try { await supabase.from('share_events').insert({ share_card_id: shareCardId, event_type: eventType }) } catch { /* fire and forget */ }
}
