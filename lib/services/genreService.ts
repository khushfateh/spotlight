import { supabase } from '@/lib/supabase/client'
import type { SupabaseGenre } from '@/lib/supabase/types'

// Cached genres to avoid repeated fetches
let cachedGenres: SupabaseGenre[] | null = null

export async function getAllGenres(): Promise<SupabaseGenre[]> {
  if (cachedGenres) return cachedGenres
  if (!supabase) return []
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('category')
    .order('name')
  if (error) {
    console.error('genreService.getAllGenres:', error.message)
    return []
  }
  cachedGenres = data ?? []
  return cachedGenres
}

export async function getGenreCategories(): Promise<string[]> {
  const genres = await getAllGenres()
  return [...new Set(genres.map(g => g.category))]
}

export async function getGenresByCategory(): Promise<Record<string, SupabaseGenre[]>> {
  const genres = await getAllGenres()
  return genres.reduce<Record<string, SupabaseGenre[]>>((acc, genre) => {
    if (!acc[genre.category]) acc[genre.category] = []
    acc[genre.category].push(genre)
    return acc
  }, {})
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getUserGenreIds(userId: string): Promise<string[]> {
  if (!supabase || !UUID_RE.test(userId)) return []
  const { data, error } = await supabase
    .from('user_preferences')
    .select('genre_id')
    .eq('user_id', userId)
  if (error) {
    console.error('genreService.getUserGenreIds:', error.message)
    return []
  }
  return data?.map(p => p.genre_id) ?? []
}

export async function getUserGenres(userId: string): Promise<SupabaseGenre[]> {
  const genreIds = await getUserGenreIds(userId)
  if (genreIds.length === 0) return []
  const all = await getAllGenres()
  return all.filter(g => genreIds.includes(g.id))
}

export async function getUserGenreSlugs(userId: string): Promise<string[]> {
  const genres = await getUserGenres(userId)
  return genres.map(g => g.slug)
}

export async function updateUserGenres(userId: string, genreSlugs: string[]): Promise<void> {
  if (!supabase) return
  const allGenres = await getAllGenres()
  const genreIds = allGenres
    .filter(g => genreSlugs.includes(g.slug))
    .map(g => g.id)

  // Replace all existing preferences
  await supabase.from('user_preferences').delete().eq('user_id', userId)

  if (genreIds.length === 0) return
  const rows = genreIds.map(genre_id => ({ user_id: userId, genre_id }))
  const { error } = await supabase.from('user_preferences').insert(rows)
  if (error) console.error('genreService.updateUserGenres:', error.message)
}

export async function findGenreBySlug(slug: string): Promise<SupabaseGenre | null> {
  const all = await getAllGenres()
  return all.find(g => g.slug === slug) ?? null
}
