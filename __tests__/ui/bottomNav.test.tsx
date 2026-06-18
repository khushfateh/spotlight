// @vitest-environment jsdom

/**
 * bottomNav.test.tsx
 *
 * Component tests for BottomNav — guards against the iOS navigation bug where
 * unauthenticated users had no way to log in or navigate.
 *
 * Environment: jsdom (set via vitest.config.ts environmentMatchGlobs)
 */

import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Module mocks (must be before imports of components) ───────────────────────

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}))

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(() => ({ userMode: 'investor', setUserMode: vi.fn() })),
  UserProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}))

import BottomNav from '@/components/layout/BottomNav'
import { useAuth } from '@/context/AuthContext'

const mockUseAuth = vi.mocked(useAuth)

function mockAuth(overrides: { isLoading?: boolean; isAuthenticated?: boolean } = {}) {
  mockUseAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    currentUser: null,
    isSupabaseMode: false,
    isNewUser: false,
    login: vi.fn(),
    logout: vi.fn(),
    switchUser: vi.fn(),
    updateInterests: vi.fn(),
    acknowledgeOnboarding: vi.fn(),
    allUsers: [],
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BottomNav — auth state rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders only a spacer div while auth is loading (no nav links, no login bar)', () => {
    mockAuth({ isLoading: true, isAuthenticated: false })
    const { container } = render(React.createElement(BottomNav))

    // No navigation links
    expect(screen.queryByRole('link')).toBeNull()
    // No nav element
    expect(screen.queryByRole('navigation')).toBeNull()
    // Spacer div is in the DOM (provides bottom padding for page content)
    const divs = container.querySelectorAll('div')
    expect(divs.length).toBeGreaterThan(0)
  })

  it('shows Login and Join links when user is not authenticated (after loading resolves)', () => {
    mockAuth({ isLoading: false, isAuthenticated: false })
    render(React.createElement(BottomNav))

    const loginLink = screen.getByRole('link', { name: /log in/i })
    const joinLink = screen.getByRole('link', { name: /join/i })

    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')

    expect(joinLink).toBeInTheDocument()
    expect(joinLink).toHaveAttribute('href', '/signup')
  })

  it('shows the discovery tagline in the unauthenticated bar', () => {
    mockAuth({ isLoading: false, isAuthenticated: false })
    render(React.createElement(BottomNav))

    expect(screen.getByText(/spot creators/i)).toBeInTheDocument()
  })

  it('shows full navigation links when authenticated', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(BottomNav))

    // Investor nav: Home, Discover, Spotlight, Discoveries, Profile
    expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^discover$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^spotlight$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^discoveries$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^profile$/i })).toBeInTheDocument()
  })

  it('does NOT show Login/Join links when authenticated', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(BottomNav))

    expect(screen.queryByRole('link', { name: /log in/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /join/i })).toBeNull()
  })

  it('authenticated nav home link points to /', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(BottomNav))

    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('authenticated nav includes /spotlight as center action', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(BottomNav))

    const spotlightLink = screen.getByRole('link', { name: /spotlight/i })
    expect(spotlightLink).toHaveAttribute('href', '/spotlight')
  })

  it('REGRESSION: unauthenticated must not return null (no nav, no login buttons)', () => {
    mockAuth({ isLoading: false, isAuthenticated: false })
    const { container } = render(React.createElement(BottomNav))

    // Must have SOME content — old code returned null which rendered nothing at all
    expect(container.firstChild).not.toBeNull()

    // Must have login links — no way to authenticate otherwise on mobile
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })
})
