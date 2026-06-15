'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { UserProvider } from '@/context/UserContext'
import { SpotlightCursor } from '@/components/effects/SpotlightCursor'

// Auth flow routes — never get app chrome
const AUTH_ONLY_ROUTES = ['/login', '/signup', '/onboarding']
// Always accessible without login
const ALWAYS_PUBLIC = ['/', ...AUTH_ONLY_ROUTES]

// Inner shell — rendered inside the providers so it can read auth state
function InnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))
  const isAlwaysPublic = ALWAYS_PUBLIC.some(r =>
    r === '/' ? pathname === '/' : pathname.startsWith(r)
  )

  useEffect(() => {
    if (isLoading) return
    // Unauthenticated on a protected page → home (landing)
    if (!isAuthenticated && !isAlwaysPublic) {
      router.replace('/')
    }
    // Authenticated on login/signup → home (they're already in)
    if (isAuthenticated && isAuthOnlyRoute) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, isAlwaysPublic, isAuthOnlyRoute, router])

  // Auth flow routes never get app chrome
  if (isAuthOnlyRoute) {
    return (
      <div className="min-h-screen bg-hype-bg">
        {children}
      </div>
    )
  }

  // / with no auth → page.tsx renders LandingView itself (no chrome needed)
  if (!isAuthenticated && pathname === '/') {
    return (
      <div className="min-h-screen bg-hype-bg">
        {children}
      </div>
    )
  }

  // Loading / not yet authenticated on a protected page — spinner to avoid flash
  if (isLoading || !isAuthenticated) {
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
      <main className="pt-14 relative z-10">
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
