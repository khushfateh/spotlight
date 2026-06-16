'use client'

import { useAuth } from '@/context/AuthContext'

export function useCurrentUser() {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  return { currentUser, isAuthenticated, isLoading }
}
