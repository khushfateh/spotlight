'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { mockUsers, getUserById, DEMO_USER_ID, type MockUser } from '@/lib/mock-data/users'
import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import {
  signIn as sbSignIn,
  signUp as sbSignUp,
  signOut as sbSignOut,
  profileToMockUser,
} from '@/lib/services/authService'
import { getProfile, ensureProfile } from '@/lib/services/profileService'
import { getUserGenreSlugs } from '@/lib/services/genreService'

type AuthContextType = {
  currentUser: MockUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isSupabaseMode: boolean
  login: (userId: string) => void
  logout: () => void
  switchUser: (userId: string) => void
  updateInterests: (interests: string[]) => void
  allUsers: MockUser[]
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; confirmEmail?: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'spotlight_user_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userOverrides, setUserOverrides] = useState<Partial<MockUser>>({})

  // ── Supabase mode ────────────────────────────────────────────────────
  const loadSupabaseUser = useCallback(async (userId: string, email: string) => {
    let profile = await getProfile(userId)

    if (!profile) {
      // Profile may not exist yet — try to create it, then re-fetch
      await ensureProfile(userId, email)
      profile = await getProfile(userId)
    }

    if (profile) {
      const mockUser = profileToMockUser(profile, email)
      const slugs = await getUserGenreSlugs(userId)
      setCurrentUser({ ...mockUser, interests: slugs })
    } else {
      // Profile can't be read/created (RLS, new account, etc.) —
      // still mark the user as authenticated with a synthetic profile
      const displayName = email.split('@')[0]
      const synthetic: MockUser = {
        id: userId,
        name: displayName,
        username: `@${displayName}`,
        initials: displayName.slice(0, 2).toUpperCase(),
        avatar: '👤',
        bio: '',
        interests: [],
        spottedTickers: [],
        discoveryScore: 0,
        creatorsSpotted: 0,
        breakoutsIdentified: 0,
        avgLeadDays: 0,
        momentumAccuracy: 0,
        discoveryRank: 'Newcomer',
        badges: [],
        joinedDaysAgo: 0,
        coverColor: 'from-zinc-700 to-zinc-900',
      }
      setCurrentUser(synthetic)
    }
  }, [])

  useEffect(() => {
    if (!IS_SUPABASE_ENABLED || !supabase) {
      // Mock mode: restore from localStorage
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && getUserById(saved)) {
        const base = getUserById(saved)!
        setCurrentUser(base)
      }
      setIsLoading(false)
      return
    }

    // Supabase mode: check existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await loadSupabaseUser(data.session.user.id, data.session.user.email ?? '')
      }
      setIsLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadSupabaseUser(session.user.id, session.user.email ?? '')
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadSupabaseUser])

  // ── Mock mode: merge overrides ───────────────────────────────────────
  const currentUserWithOverrides =
    IS_SUPABASE_ENABLED
      ? currentUser
      : currentUser
        ? { ...currentUser, ...userOverrides }
        : null

  // ── Mock-only actions ─────────────────────────────────────────────────
  function login(userId: string) {
    if (IS_SUPABASE_ENABLED) return // no-op in Supabase mode
    const user = getUserById(userId)
    if (!user) return
    localStorage.setItem(STORAGE_KEY, userId)
    setCurrentUser(user)
    setUserOverrides({})
  }

  async function logout() {
    if (IS_SUPABASE_ENABLED) {
      await sbSignOut()
      setCurrentUser(null)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setCurrentUser(null)
      setUserOverrides({})
    }
  }

  function switchUser(userId: string) {
    login(userId)
  }

  function updateInterests(interests: string[]) {
    if (IS_SUPABASE_ENABLED) {
      setCurrentUser(prev => prev ? { ...prev, interests } : null)
    } else {
      setUserOverrides(prev => ({ ...prev, interests }))
    }
  }

  // ── Supabase auth actions ────────────────────────────────────────────
  async function signIn(email: string, password: string): Promise<{ error?: string }> {
    if (!IS_SUPABASE_ENABLED) {
      // Mock: just log in as default demo user
      login(DEMO_USER_ID)
      return {}
    }
    return sbSignIn(email, password)
  }

  async function signUp(email: string, password: string, name: string): Promise<{ error?: string }> {
    if (!IS_SUPABASE_ENABLED) {
      login(DEMO_USER_ID)
      return {}
    }
    return sbSignUp(email, password, name)
  }

  async function handleSignOut(): Promise<void> {
    await logout()
  }

  return (
    <AuthContext.Provider value={{
      currentUser: currentUserWithOverrides,
      isAuthenticated: !!currentUserWithOverrides,
      isLoading,
      isSupabaseMode: IS_SUPABASE_ENABLED,
      login,
      logout,
      switchUser,
      updateInterests,
      allUsers: mockUsers,
      signIn,
      signUp,
      signOut: handleSignOut,
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
