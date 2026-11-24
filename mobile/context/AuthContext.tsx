import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getProfile, type Profile } from '@/lib/services/profileService'
import type { User, Session } from '@supabase/supabase-js'

type AuthState = {
  user:               User | null
  session:            Session | null
  profile:            Profile | null
  isAuthenticated:    boolean
  isLoading:          boolean
  needsOnboarding:    boolean
  signOut:            () => Promise<void>
  refreshProfile:     () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user:               null,
  session:            null,
  profile:            null,
  isAuthenticated:    false,
  isLoading:          true,
  needsOnboarding:    false,
  signOut:            async () => {},
  refreshProfile:     async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const p = await getProfile(userId).catch(() => null)
    setProfile(p)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  // Needs onboarding: authenticated, profile loaded, but not completed
  const needsOnboarding = !!user && !isLoading && !!profile && !profile.onboarding_complete

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAuthenticated:    !!session,
      isLoading,
      needsOnboarding,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
