import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import { creators as mockCreators } from '@/lib/mock-data/creators'
import type { Creator } from '@/types'

type SupabaseCreatorRow = {
  id: string
  name: string
  ticker: string
  slug: string
  category: string
  image_url: string | null
  bio: string | null
  momentum_score: number
  spotify_image_url: string | null
  spotify_url: string | null
  spotify_artist_id: string | null
}

function mergeWithMock(
  row: SupabaseCreatorRow,
  mock: Creator | undefined,
): Creator {
  if (!mock) {
    // Minimal object when no mock counterpart exists (shouldn't happen in practice)
    return {
      id: row.id,
      ticker: row.ticker,
      name: row.name,
      category: row.category as Creator['category'],
      bio: row.bio ?? '',
      avatar: row.name.slice(0, 2).toUpperCase(),
      coverColor: 'from-zinc-700 to-zinc-900',
      creatorScore: 50,
      socialHandles: {},
      imageUrl: row.spotify_image_url ?? row.image_url ?? undefined,
    }
  }

  return {
    ...mock,
    // Prefer Supabase values when present
    bio: row.bio ?? mock.bio,
    imageUrl: row.spotify_image_url ?? row.image_url ?? mock.imageUrl,
  }
}

export async function getAllCreators(): Promise<Creator[]> {
  if (!IS_SUPABASE_ENABLED) return mockCreators

  try {
    const { data, error } = await supabase!
      .from('creators')
      .select('id,name,ticker,slug,category,image_url,bio,momentum_score,spotify_image_url,spotify_url,spotify_artist_id')
      .order('momentum_score', { ascending: false })

    if (error || !data || data.length === 0) return mockCreators

    const mockByTicker = new Map(mockCreators.map(c => [c.ticker.toUpperCase(), c]))

    return data.map(row =>
      mergeWithMock(row as SupabaseCreatorRow, mockByTicker.get(row.ticker.toUpperCase()))
    )
  } catch {
    return mockCreators
  }
}

export async function getCreatorByTicker(ticker: string): Promise<Creator | null> {
  if (!IS_SUPABASE_ENABLED) {
    return mockCreators.find(c => c.ticker.toUpperCase() === ticker.toUpperCase()) ?? null
  }

  try {
    const { data, error } = await supabase!
      .from('creators')
      .select('id,name,ticker,slug,category,image_url,bio,momentum_score,spotify_image_url,spotify_url,spotify_artist_id')
      .eq('ticker', ticker.toUpperCase())
      .single()

    if (error || !data) {
      return mockCreators.find(c => c.ticker.toUpperCase() === ticker.toUpperCase()) ?? null
    }

    const mock = mockCreators.find(c => c.ticker.toUpperCase() === ticker.toUpperCase())
    return mergeWithMock(data as SupabaseCreatorRow, mock)
  } catch {
    return mockCreators.find(c => c.ticker.toUpperCase() === ticker.toUpperCase()) ?? null
  }
}

export async function searchCreators(query: string): Promise<Creator[]> {
  if (!IS_SUPABASE_ENABLED) {
    const q = query.toLowerCase()
    return mockCreators.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q)
    )
  }

  try {
    const { data, error } = await supabase!
      .from('creators')
      .select('id,name,ticker,slug,category,image_url,bio,momentum_score,spotify_image_url,spotify_url,spotify_artist_id')
      .or(`name.ilike.%${query}%,ticker.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(20)

    if (error || !data) {
      const q = query.toLowerCase()
      return mockCreators.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q)
      )
    }

    const mockByTicker = new Map(mockCreators.map(c => [c.ticker.toUpperCase(), c]))
    return data.map(row =>
      mergeWithMock(row as SupabaseCreatorRow, mockByTicker.get(row.ticker.toUpperCase()))
    )
  } catch {
    const q = query.toLowerCase()
    return mockCreators.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q)
    )
  }
}

export async function getCreatorsByGenre(genreSlug: string): Promise<Creator[]> {
  if (!IS_SUPABASE_ENABLED) {
    const { getCreatorsInGenre } = await import('@/lib/mock-data/genres')
    const tickers = getCreatorsInGenre(genreSlug)
    const mockByTicker = new Map(mockCreators.map(c => [c.ticker.toUpperCase(), c]))
    return tickers.flatMap(t => {
      const c = mockByTicker.get(t.toUpperCase())
      return c ? [c] : []
    })
  }

  const fallback = async () => {
    const { getCreatorsInGenre } = await import('@/lib/mock-data/genres')
    const tickers = getCreatorsInGenre(genreSlug)
    const mockByTicker = new Map(mockCreators.map(c => [c.ticker.toUpperCase(), c]))
    return tickers.flatMap(t => {
      const c = mockByTicker.get(t.toUpperCase())
      return c ? [c] : []
    })
  }

  try {
    // Two-step: find genre → find creator_genres → fetch creators
    const { data: genreData } = await supabase!
      .from('genres')
      .select('id')
      .eq('slug', genreSlug)
      .maybeSingle()

    if (!genreData) return fallback()

    const { data: junctionData } = await supabase!
      .from('creator_genres')
      .select('creator_id')
      .eq('genre_id', genreData.id)

    if (!junctionData || junctionData.length === 0) return fallback()

    const creatorIds = junctionData.map(r => r.creator_id)
    const { data, error } = await supabase!
      .from('creators')
      .select('id,name,ticker,slug,category,image_url,bio,momentum_score,spotify_image_url,spotify_url,spotify_artist_id')
      .in('id', creatorIds)

    if (error || !data || data.length === 0) return fallback()

    const mockByTicker = new Map(mockCreators.map(c => [c.ticker.toUpperCase(), c]))
    return data.map(row =>
      mergeWithMock(row as SupabaseCreatorRow, mockByTicker.get(row.ticker.toUpperCase()))
    )
  } catch {
    return fallback()
  }
}

