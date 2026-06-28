'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { UserProvider } from '@/context/UserContext'
import { AmbientWorld, ScanSweep } from '@/components/experience/AmbientWorld'
import { CursorAura } from '@/components/experience/CursorAura'
import { SpotlightParticles } from '@/components/experience/SpotlightParticles'
import { FloatingField } from '@/components/experience/FloatingField'
import { ExperienceProvider } from '@/components/experience/ExperienceProvider'

const AUTH_FLOW_ROUTES = ['/login', '/signup', '/onboarding', '/share', '/username-setup']
const PROTECTED_ROUTES = ['/profile', '/discoveries']

function InnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isNewUser, needsUsername } = useAuth()
  const isAuthFlow = AUTH_FLOW_ROUTES.some(r => pathname.startsWith(r))
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && isNewUser && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding')
      return
    }
    if (isAuthenticated && !isNewUser && needsUsername && !pathname.startsWith('/username-setup')) {
      router.replace('/username-setup')
      return
    }
    if (!isAuthenticated && isProtected) router.replace('/')
    const isLoginOrSignup = ['/login', '/signup'].some(r => pathname.startsWith(r))
    if (isAuthenticated && isLoginOrSignup) router.replace('/')
  }, [isAuthenticated, isLoading, isProtected, isNewUser, needsUsername, pathname, router])

  if (isAuthFlow) {
    return <div className="min-h-screen bg-hype-bg">{children}</div>
  }

  if (isProtected && (isLoading || !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-hype-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hype-gold/30 border-t-hype-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hype-bg">
      {/* ── Experience layer ───────────────────────────────────────────── */}
      <AmbientWorld />
      <FloatingField />
      <SpotlightParticles />
      <ScanSweep />
      <CursorAura />

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
        <ExperienceProvider>
          <InnerShell>{children}</InnerShell>
        </ExperienceProvider>
      </UserProvider>
    </AuthProvider>
  )
}
