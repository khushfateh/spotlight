'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { UserProvider } from '@/context/UserContext'
import { SpotlightCursor } from '@/components/effects/SpotlightCursor'

// These routes render without app chrome (no TopBar / BottomNav)
const AUTH_FLOW_ROUTES = ['/login', '/signup', '/onboarding', '/share']

// These routes require a logged-in user — everything else is publicly browsable
const PROTECTED_ROUTES = ['/profile']

// Inner shell — rendered inside the providers so it can read auth state
function InnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isNewUser } = useAuth()
  const isAuthFlow = AUTH_FLOW_ROUTES.some(r => pathname.startsWith(r))
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    if (isLoading) return
    // New authenticated user who hasn't completed onboarding → always send to onboarding
    if (isAuthenticated && isNewUser && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding')
      return
    }
    // Unauthenticated on a protected page → redirect home
    if (!isAuthenticated && isProtected) {
      router.replace('/')
    }
    // Authenticated on login/signup → go home
    const isLoginOrSignup = ['/login', '/signup'].some(r => pathname.startsWith(r))
    if (isAuthenticated && isLoginOrSignup) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, isProtected, isNewUser, pathname, router])

  // Auth-flow pages (login / signup / onboarding) — no chrome
  if (isAuthFlow) {
    return <div className="min-h-screen bg-hype-bg">{children}</div>
  }

  // Protected routes only: show spinner while auth resolves, then redirect if unauthed
  if (isProtected && (isLoading || !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-hype-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hype-gold/30 border-t-hype-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hype-bg">
      {/* Global aurora ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute ambient-orb-1"
          style={{
            width: 900, height: 900,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.7) 0%, transparent 60%)',
            filter: 'blur(130px)',
            top: '-250px', left: '25%',
          }}
        />
        <div
          className="absolute ambient-orb-2"
          style={{
            width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,33,168,0.65) 0%, transparent 60%)',
            filter: 'blur(140px)',
            bottom: '5%', right: '-15%',
          }}
        />
        <div
          className="absolute ambient-orb-2"
          style={{
            width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.5) 0%, transparent 65%)',
            filter: 'blur(120px)',
            top: '40%', left: '-15%',
          }}
        />
      </div>
      <SpotlightCursor />
      <TopBar />
      <main className="pt-14 relative" style={{ overflowX: 'clip' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}


export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <InnerShell>{children}</InnerShell>
      </UserProvider>
    </AuthProvider>
  )
}
