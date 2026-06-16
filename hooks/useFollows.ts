'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getFollowedTickers, followCreator, unfollowCreator } from '@/lib/services/followService'

export function useFollows() {
  const { currentUser, isSupabaseMode } = useAuth()
  const [followedTickers, setFollowedTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFollows = useCallback(async () => {
    if (!isSupabaseMode || !currentUser) return
    setLoading(true)
    const tickers = await getFollowedTickers(currentUser.id)
    setFollowedTickers(tickers)
    setLoading(false)
  }, [isSupabaseMode, currentUser])

  useEffect(() => {
    fetchFollows()
  }, [fetchFollows])

  async function follow(ticker: string) {
    setFollowedTickers(prev => [...new Set([...prev, ticker.toUpperCase()])])
    if (isSupabaseMode && currentUser) {
      await followCreator(currentUser.id, ticker)
    }
  }

  async function unfollow(ticker: string) {
    setFollowedTickers(prev => prev.filter(t => t !== ticker.toUpperCase()))
    if (isSupabaseMode && currentUser) {
      await unfollowCreator(currentUser.id, ticker)
    }
  }

  function isFollowing(ticker: string) {
    return followedTickers.includes(ticker.toUpperCase())
  }

  return { followedTickers, loading, follow, unfollow, isFollowing }
}
