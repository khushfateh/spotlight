import { supabase } from '@/lib/supabase'

export type CreatorLiveData = {
  id:                 string
  ticker:             string
  spotifyImageUrl:    string | null
  spotifyFollowers:   number | null
  spotifyPopularity:  number | null
  spotifyUrl:         string | null
}

const cache = new Map<string, CreatorLiveData>()

export async function getCreatorLiveData(ticker: string): Promise<CreatorLiveData | null> {
  const upper = ticker.toUpperCase()
  if (cache.has(upper)) return cache.get(upper)!

  const { data, error } = await supabase
    .from('creators')
    .select('id,ticker,spotify_image_url,spotify_followers,spotify_popularity,spotify_url')
    .eq('ticker', upper)
    .maybeSingle()

  if (error || !data) return null

  const live: CreatorLiveData = {
    id:                data.id,
    ticker:            data.ticker,
    spotifyImageUrl:   (data as { spotify_image_url: string | null }).spotify_image_url,
    spotifyFollowers:  (data as { spotify_followers: number | null }).spotify_followers,
    spotifyPopularity: (data as { spotify_popularity: number | null }).spotify_popularity,
    spotifyUrl:        (data as { spotify_url: string | null }).spotify_url,
  }
  cache.set(upper, live)
  return live
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
