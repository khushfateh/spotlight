'use client'

import { useState, useEffect } from 'react'
import { getAllGenres, getGenresByCategory } from '@/lib/services/genreService'
import type { SupabaseGenre } from '@/lib/supabase/types'

export function useGenres() {
  const [genres, setGenres] = useState<SupabaseGenre[]>([])
  const [byCategory, setByCategory] = useState<Record<string, SupabaseGenre[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllGenres(), getGenresByCategory()]).then(([all, grouped]) => {
      if (cancelled) return
      setGenres(all)
      setByCategory(grouped)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { genres, byCategory, loading }
}
