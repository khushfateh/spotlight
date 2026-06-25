// @vitest-environment jsdom

/**
 * topBar.test.tsx
 *
 * Component tests for TopBar — guards against the bug where the profile avatar
 * was shown during auth loading (isLoading=true), causing a tap on the circle
 * to navigate to /profile which immediately redirected to / (confusing on iOS).
 *
 * Environment: jsdom (set via vitest.config.ts environmentMatchGlobs)
 */

import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(() => ({
    userMode: 'investor',
    user: { name: 'Test User', username: '@test', avatar: 'TU', bio: '' },
  })),
}))

vi.mock('@/lib/mock-data', () => ({
  notifications: [],
}))

vi.mock('@/components/ui/SpotlightLogo', () => ({
  SpotlightWordmark: () => React.createElement('span', { 'data-testid': 'wordmark' }, 'SPOTLIGHT'),
}))

import TopBar from '@/components/layout/TopBar'
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
    signInWithGoogle: vi.fn(),
    ...overrides,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TopBar — auth state rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('always renders the SPOTLIGHT wordmark', () => {
    mockAuth({ isLoading: false, isAuthenticated: false })
    render(React.createElement(TopBar))
    expect(screen.getByTestId('wordmark')).toBeInTheDocument()
  })

  it('renders a spacer (no links) while auth is loading', () => {
    mockAuth({ isLoading: true, isAuthenticated: false })
    render(React.createElement(TopBar))

    // No login/join links during loading
    expect(screen.queryByRole('link', { name: /log in/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /join/i })).toBeNull()
    // No profile link during loading
    expect(screen.queryByRole('link', { name: /profile/i })).toBeNull()
  })

  it('renders Login and Join links when not authenticated', () => {
    mockAuth({ isLoading: false, isAuthenticated: false })
    render(React.createElement(TopBar))

    const loginLink = screen.getByRole('link', { name: /log in/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')

    const joinLink = screen.getByRole('link', { name: /join/i })
    expect(joinLink).toBeInTheDocument()
    expect(joinLink).toHaveAttribute('href', '/signup')
  })

  it('renders notifications + profile links when authenticated', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(TopBar))

    const notifLink = screen.getByRole('link', { name: '' })  // Bell icon link (no text)
    expect(notifLink).toBeTruthy()

    const profileLink = screen.getByRole('link', { name: /tu/i })  // Avatar initials
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('does NOT render Login/Join when authenticated', () => {
    mockAuth({ isLoading: false, isAuthenticated: true })
    render(React.createElement(TopBar))

    expect(screen.queryByRole('link', { name: /log in/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /join/i })).toBeNull()
  })

  it('REGRESSION: old code showed profile avatar during loading (caused confusing redirect on iOS)', () => {
    // Old code: {!isLoading && !isAuthenticated ? <Login/Join> : <Bell+Profile>}
    // When isLoading=true → !isLoading=false → condition false → shows Bell+Profile (BUG)
    // New code: isLoading ? <spacer> : !isAuthenticated ? <Login/Join> : <Bell+Profile>
    mockAuth({ isLoading: true, isAuthenticated: false })
    render(React.createElement(TopBar))

    // With the fix: NO profile-related links during loading
    const links = screen.queryAllByRole('link')
    // Only the wordmark link (href="/") should be present during loading
    const nonWordmarkLinks = links.filter(l => l.getAttribute('href') !== '/')
    expect(nonWordmarkLinks).toHaveLength(0)
  })
})
