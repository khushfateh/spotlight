'use client'

import { useState, useEffect } from 'react'
import { SPOTIFY_ARTIST_MAP } from '@/lib/spotify/artist-map'
import type { SpotifyCreatorSnapshot } from '@/lib/spotify/types'

export function useCreatorSpotifyData(ticker: string) {
  const [snapshot, setSnapshot] = useState<SpotifyCreatorSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const artistId = SPOTIFY_ARTIST_MAP[ticker.toUpperCase()]
    if (!artistId) { setLoading(false); return }

    fetch(`/api/spotify/artist/${artistId}`)
      .then(r => r.ok ? r.json() as Promise<SpotifyCreatorSnapshot> : null)
      .then(data => { if (!cancelled && data) setSnapshot(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [ticker])

  return { snapshot, loading }
}
