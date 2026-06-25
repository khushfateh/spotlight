// Phase 2 placeholder — not implemented yet
// Future providers: Instagram, YouTube, TikTok, X, News, Events
import type { ExternalSignalProvider } from './types'

export const externalProviders: ExternalSignalProvider[] = []

export async function fetchExternalSignals(creatorId: string): Promise<Record<string, number>> {
  if (externalProviders.length === 0) return {}
  const results = await Promise.all(
    externalProviders.map(p => p.fetchSignals(creatorId).catch(() => ({}) as Record<string, number>))
  )
  return Object.assign({}, ...results) as Record<string, number>
}
