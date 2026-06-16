import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import { genres as mockGenres } from '@/lib/mock-data/genres'
import type { Genre } from '@/lib/mock-data/genres'

export async function getAllGenres(): Promise<Genre[]> {
  if (!IS_SUPABASE_ENABLED) return mockGenres

  try {
    const { data, error } = await supabase!
      .from('genres')
      .select('id,name,slug,description')
      .order('name')

    if (error || !data || data.length === 0) return mockGenres

    // Merge Supabase names/descriptions with mock genre metadata (colors, emojis, tickers)
    return mockGenres.map(mock => {
      const row = data.find(r => r.slug === mock.id)
      return row
        ? { ...mock, label: row.name ?? mock.label, description: row.description ?? mock.description }
        : mock
    })
  } catch {
    return mockGenres
  }
}

export async function getGenreBySlug(slug: string): Promise<Genre | undefined> {
  // Always serve from mock — genre UI metadata (colors, emojis) lives there
  return mockGenres.find(g => g.id === slug)
}
