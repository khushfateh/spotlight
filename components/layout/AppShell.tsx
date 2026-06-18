'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { UserProvider } from '@/context/UserContext'
import { SpotlightCursor } from '@/components/effects/SpotlightCursor'

// These routes render without app chrome (no TopBar / BottomNav)
// /share is the public social sharing page — accessible without auth
const AUTH_FLOW_ROUTES = ['/login', '/signup', '/onboarding', '/share']

// Inner shell — rendered inside the providers so it can read auth state
function InnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isNewUser } = useAuth()
  const isAuthFlow = AUTH_FLOW_ROUTES.some(r => pathname.startsWith(r))
  const isHome = pathname === '/'

  useEffect(() => {
    if (isLoading) return
    // New authenticated user who hasn't completed onboarding → always send to onboarding
    if (isAuthenticated && isNewUser && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding')
      return
    }
    // Unauthenticated on a protected page (not home, not auth-flow) → redirect home
    if (!isAuthenticated && !isHome && !isAuthFlow) {
      router.replace('/')
    }
    // Authenticated on login/signup → go home
    const isLoginOrSignup = ['/login', '/signup'].some(r => pathname.startsWith(r))
    if (isAuthenticated && isLoginOrSignup) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, isHome, isAuthFlow, isNewUser, pathname, router])

  // Auth-flow pages (login / signup / onboarding) — no chrome
  if (isAuthFlow) {
    return <div className="min-h-screen bg-hype-bg">{children}</div>
  }

  // Home is public — always render with chrome (TopBar adapts based on auth state)
  // Protected routes: show spinner while auth resolves, then redirect if still unauthed
  if (!isHome && (isLoading || !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-hype-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hype-gold/30 border-t-hype-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hype-bg">
      {/* Global ambient — very slow, almost imperceptible depth */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute ambient-orb-1"
          style={{
            width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #C9A84C 0%, transparent 65%)',
            filter: 'blur(100px)',
            top: '-200px', left: '30%',
          }}
        />
        <div
          className="absolute ambient-orb-2"
          style={{
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #6366F1 0%, transparent 65%)',
            filter: 'blur(120px)',
            bottom: '10%', right: '-10%',
          }}
        />
      </div>
      <SpotlightCursor />
      <TopBar />
      {/* No z-index on main — adding z-index here creates a stacking context that buries
          fixed children (TradeSheet z-51) below sibling fixed elements (BottomNav z-40) on iOS. */}
      <main className="pt-14 relative">
        <div className="md:flex md:min-h-screen">
          <DesktopSidebar />
          <div className="flex-1 md:ml-56 max-w-2xl md:max-w-none">
            {children}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

function DesktopSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Discover' },
    { href: '/spotlight', label: 'Spotlight', highlight: true },
    { href: '/portfolio', label: 'Discoveries' },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <div className="hidden md:flex md:flex-col md:w-56 md:fixed md:left-0 md:top-14 md:bottom-0 md:border-r md:border-hype-border md:bg-hype-bg md:py-6 md:px-4">
      <nav className="space-y-0.5">
        {links.map(({ href, label, highlight }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <a
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-hype-surface-2 text-hype-text border border-hype-border'
                  : highlight
                  ? 'text-hype-gold hover:bg-hype-gold/5'
                  : 'text-hype-muted hover:text-hype-secondary hover:bg-hype-surface',
              )}
            >
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-hype-gold flex-shrink-0" />
              )}
              {label}
            </a>
          )
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-xl border border-hype-border p-3">
          <p className="text-hype-dim text-[10px] leading-relaxed">
            Cultural discovery platform. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
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
