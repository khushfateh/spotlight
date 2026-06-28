'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { mockUsers, getUserById, DEMO_USER_ID, type MockUser } from '@/lib/mock-data/users'
import { supabase, IS_SUPABASE_ENABLED } from '@/lib/supabase/client'
import {
  signIn as sbSignIn,
  signUp as sbSignUp,
  signOut as sbSignOut,
  signInWithGoogle as sbSignInWithGoogle,
  signInWithApple as sbSignInWithApple,
  profileToMockUser,
} from '@/lib/services/authService'
import { getProfile, ensureProfile } from '@/lib/services/profileService'
import { getUserGenreSlugs } from '@/lib/services/genreService'

type AuthContextType = {
  currentUser: MockUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isSupabaseMode: boolean
  isNewUser: boolean
  needsUsername: boolean
  login: (userId: string) => void
  logout: () => void
  switchUser: (userId: string) => void
  updateInterests: (interests: string[]) => void
  acknowledgeOnboarding: () => void
  refreshUser: () => Promise<void>
  allUsers: MockUser[]
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; confirmEmail?: boolean }>
  signOut: () => Promise<void>
  signInWithGoogle: (intent?: 'join' | 'login') => Promise<{ error?: string }>
  signInWithApple: (intent?: 'join' | 'login') => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'spotlight_user_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [userOverrides, setUserOverrides] = useState<Partial<MockUser>>({})
  const [supabaseSession, setSupabaseSession] = useState<{ userId: string; email: string } | null>(null)

  // ── Supabase mode ────────────────────────────────────────────────────
  const loadSupabaseUser = useCallback(async (userId: string, email: string) => {
    try {
      let profile = await getProfile(userId)

      if (!profile) {
        await ensureProfile(userId, email)
        profile = await getProfile(userId)
      }

      if (profile) {
        const mockUser = profileToMockUser(profile, email)
        const slugs = await getUserGenreSlugs(userId)
        setCurrentUser({ ...mockUser, interests: slugs })
        setIsNewUser(!profile.onboarding_complete)
        // Needs username: completed onboarding but never set a username
        setNeedsUsername(!!profile.onboarding_complete && !profile.username)
      } else {
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
        setIsNewUser(true)
        setNeedsUsername(false)
      }
    } catch (err) {
      console.error('[auth] loadSupabaseUser failed:', err)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!supabaseSession) return
    await loadSupabaseUser(supabaseSession.userId, supabaseSession.email)
  }, [supabaseSession, loadSupabaseUser])

  useEffect(() => {
    if (!IS_SUPABASE_ENABLED || !supabase) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && getUserById(saved)) {
        const base = getUserById(saved)!
        setCurrentUser(base)
      }
      setIsLoading(false)
      return
    }

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session?.user) {
          const { id, email } = data.session.user
          setSupabaseSession({ userId: id, email: email ?? '' })
          await loadSupabaseUser(id, email ?? '')
        }
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })

    const authTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { id, email } = session.user
        setSupabaseSession({ userId: id, email: email ?? '' })
        await loadSupabaseUser(id, email ?? '')
      } else {
        setCurrentUser(null)
        setIsNewUser(false)
        setNeedsUsername(false)
        setSupabaseSession(null)
      }
    })

    return () => {
      clearTimeout(authTimeout)
      subscription.unsubscribe()
    }
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
    if (IS_SUPABASE_ENABLED) return
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
      setNeedsUsername(false)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setCurrentUser(null)
      setUserOverrides({})
    }
  }

  function switchUser(userId: string) {
    login(userId)
  }

  function acknowledgeOnboarding() {
    setIsNewUser(false)
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

  async function signInWithGoogle(intent: 'join' | 'login' = 'join'): Promise<{ error?: string }> {
    if (!IS_SUPABASE_ENABLED) return { error: 'Google sign-in requires Supabase' }
    return sbSignInWithGoogle(intent)
  }

  async function signInWithApple(intent: 'join' | 'login' = 'join'): Promise<{ error?: string }> {
    if (!IS_SUPABASE_ENABLED) return { error: 'Apple sign-in requires Supabase' }
    return sbSignInWithApple(intent)
  }

  return (
    <AuthContext.Provider value={{
      currentUser: currentUserWithOverrides,
      isAuthenticated: !!currentUserWithOverrides,
      isLoading,
      isSupabaseMode: IS_SUPABASE_ENABLED,
      isNewUser,
      needsUsername,
      login,
      logout,
      switchUser,
      updateInterests,
      acknowledgeOnboarding,
      refreshUser,
      allUsers: mockUsers,
      signIn,
      signUp,
      signOut: handleSignOut,
      signInWithGoogle,
      signInWithApple,
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
