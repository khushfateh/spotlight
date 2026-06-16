'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserGenres, updateUserGenres } from '@/lib/services/genreService'
import { markOnboardingComplete } from '@/lib/services/profileService'
import type { SupabaseGenre } from '@/lib/supabase/types'

export function useUserPreferences() {
  const { currentUser, isSupabaseMode, updateInterests } = useAuth()
  const [genres, setGenres] = useState<SupabaseGenre[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGenres = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const data = await getUserGenres(currentUser.id)
    setGenres(data)
    setLoading(false)
  }, [isSupabaseMode, currentUser])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  async function saveGenres(slugs: string[]) {
    updateInterests(slugs) // local state update immediately
    if (!isSupabaseMode || !currentUser) return
    await updateUserGenres(currentUser.id, slugs)
    await fetchGenres()
  }

  async function completeOnboarding(slugs: string[]) {
    await saveGenres(slugs)
    if (isSupabaseMode && currentUser) {
      await markOnboardingComplete(currentUser.id)
    }
  }

  const genreSlugs = isSupabaseMode
    ? genres.map(g => g.slug)
    : currentUser?.interests ?? []

  return { genres, genreSlugs, loading, saveGenres, completeOnboarding, refetch: fetchGenres }
}
