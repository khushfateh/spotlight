'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { mockUsers, getUserById, DEMO_USER_ID, type MockUser } from '@/lib/mock-data/users'

type AuthContextType = {
  currentUser: MockUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userId: string) => void
  logout: () => void
  switchUser: (userId: string) => void
  updateInterests: (interests: string[]) => void
  allUsers: MockUser[]
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'spotlight_user_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Holds runtime overrides (e.g. after onboarding updates interests)
  const [userOverrides, setUserOverrides] = useState<Partial<MockUser>>({})

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && getUserById(saved)) {
      setCurrentUserId(saved)
    }
    setIsLoading(false)
  }, [])

  const baseUser = currentUserId ? getUserById(currentUserId) ?? null : null
  const currentUser = baseUser ? { ...baseUser, ...userOverrides } : null

  function login(userId: string) {
    localStorage.setItem(STORAGE_KEY, userId)
    setCurrentUserId(userId)
    setUserOverrides({})
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentUserId(null)
    setUserOverrides({})
  }

  function switchUser(userId: string) {
    login(userId)
  }

  function updateInterests(interests: string[]) {
    setUserOverrides(prev => ({ ...prev, interests }))
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      login,
      logout,
      switchUser,
      updateInterests,
      allUsers: mockUsers,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
