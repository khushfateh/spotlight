import { supabase } from '@/lib/supabase/client'
import type { CreatorDataProvider } from './types'

// Mock provider — returns computed mock values until real integrations exist.
// When Spotify/Instagram/X providers are built, register them here and swap.
export class MockDataProvider implements CreatorDataProvider {
  readonly name = 'mock'

  async getStreamingScore(ticker: string): Promise<number | null> {
    // Would call Spotify API in production. Returns normalised 0–1.
    const SCORES: Record<string, number> = {
      SABRINA: 0.92, DOJACAT: 0.90, PESOPLUMA: 0.88,
      NEWJEANS: 0.84, TYLERTC: 0.82, LILNASX: 0.80,
      APDHILLON: 0.78, SHUBH: 0.68, KARANAUJLA: 0.65,
      HANUMANKIND: 0.55, ICESPICE: 0.79, CORPSE: 0.48,
      SZA: 0.88, WEEKND: 0.90, HER: 0.72, GIVEON: 0.65,
      BURNA: 0.82, WIZKID: 0.78, TEMS: 0.74, DAVIDO: 0.70,
      SKRLL: 0.76, DIPLO: 0.80, PORTER: 0.68, FLUME: 0.65,
      BPINK: 0.85, SKIDS: 0.78, AESPA: 0.80, BTS: 0.92,
      BUNNY: 0.90, KAROLG: 0.82, BALVIN: 0.78, OZUNA: 0.72,
    }
    return SCORES[ticker.toUpperCase()] ?? null
  }

  async getSocialScore(ticker: string): Promise<number | null> {
    // Would call Instagram/X/TikTok API in production.
    const SCORES: Record<string, number> = {
      SABRINA: 0.88, DOJACAT: 0.89, ICESPICE: 0.82, NEWJEANS: 0.85,
      PESOPLUMA: 0.86, TYLERTC: 0.75, LILNASX: 0.78, APDHILLON: 0.74,
      SHUBH: 0.62, HANUMANKIND: 0.58, KARANAUJLA: 0.60,
      SZA: 0.90, WEEKND: 0.92, BURNA: 0.85, WIZKID: 0.82,
      DIPLO: 0.80, BTS: 0.95, BUNNY: 0.88, KAROLG: 0.84,
    }
    return SCORES[ticker.toUpperCase()] ?? null
  }

  async getNewsScore(ticker: string): Promise<number | null> {
    // Would call news aggregation API in production.
    const SCORES: Record<string, number> = {
      SABRINA: 0.85, PESOPLUMA: 0.84, ICESPICE: 0.78, NEWJEANS: 0.76,
      TYLERTC: 0.74, HANUMANKIND: 0.65, APDHILLON: 0.70, SHUBH: 0.55,
      SZA: 0.82, WEEKND: 0.80, BURNA: 0.78, BTS: 0.88,
    }
    return SCORES[ticker.toUpperCase()] ?? null
  }

  async getCatalystScore(ticker: string): Promise<number | null> {
    // Based on upcoming catalysts from mock data
    const SCORES: Record<string, number> = {
      ICESPICE: 0.92, APDHILLON: 0.88, PESOPLUMA: 0.85,
      SABRINA: 0.80, NEWJEANS: 0.82, LILNASX: 0.78,
      SHUBH: 0.76, KARANAUJLA: 0.74, HANUMANKIND: 0.72, TYLERTC: 0.70,
      SZA: 0.86, WEEKND: 0.84, BURNA: 0.80, DIPLO: 0.75,
    }
    return SCORES[ticker.toUpperCase()] ?? null
  }
}

// Spotify provider — reads from synced Supabase fields. Returns null when no Spotify data exists.
export class SpotifyCreatorDataProvider implements CreatorDataProvider {
  readonly name = 'spotify'

  async getStreamingScore(_ticker: string): Promise<number | null> {
    // followers and popularity are not available via Spotify Client Credentials flow
    return null
  }

  async getSocialScore(_ticker: string): Promise<number | null> {
    return null
  }

  async getNewsScore(_ticker: string): Promise<number | null> {
    return null
  }

  async getCatalystScore(ticker: string): Promise<number | null> {
    if (!supabase) return null
    const { data } = await supabase
      .from('creators')
      .select('spotify_latest_release_date')
      .eq('ticker', ticker.toUpperCase())
      .maybeSingle()

    if (!data?.spotify_latest_release_date) return null

    const [year, month = '1'] = data.spotify_latest_release_date.split('-')
    const releaseMs = new Date(parseInt(year), parseInt(month) - 1, 1).getTime()
    const monthsAgo = (Date.now() - releaseMs) / (1000 * 60 * 60 * 24 * 30)

    if (monthsAgo < 3) return 0.85
    if (monthsAgo < 6) return 0.70
    if (monthsAgo < 12) return 0.50
    return 0.25
  }
}

// Registry — future providers plug in here
const providers: CreatorDataProvider[] = [new MockDataProvider()]

export function getActiveProvider(): CreatorDataProvider {
  return providers[0]
}

// Future: register real providers like SpotifyProvider, InstagramProvider, etc.
export function registerProvider(provider: CreatorDataProvider): void {
  providers.unshift(provider)
}
