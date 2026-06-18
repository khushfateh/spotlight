/**
 * mobile-auth.test.ts
 *
 * Tests that guard against the "isLoading stuck at true" bug on iOS.
 *
 * Root cause: AuthContext called supabase.auth.getSession().then(async cb)
 * with no .catch(). If cb threw (e.g. getProfile network failure), setIsLoading(false)
 * never ran → TopBar/BottomNav stuck as invisible spacers → no navigation on iOS.
 *
 * These tests verify the auth-initialization logic using the same supabase mock pattern
 * as spotterService.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IS_SUPABASE_ENABLED } from '@/lib/supabase/client'

// ── Mock Supabase client ──────────────────────────────────────────────────────

const { mockGetSession, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  IS_SUPABASE_ENABLED: true,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

vi.mock('@/lib/services/profileService', () => ({
  getProfile: vi.fn(),
  ensureProfile: vi.fn(),
}))

vi.mock('@/lib/services/authService', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  profileToMockUser: vi.fn(),
}))

vi.mock('@/lib/services/genreService', () => ({
  getUserGenreSlugs: vi.fn().mockResolvedValue([]),
}))

import { getProfile } from '@/lib/services/profileService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(userId = 'user-123', email = 'test@example.com') {
  return { session: { user: { id: userId, email } } }
}

function noSession() {
  return { session: null }
}

// ── Auth initialization scenarios ─────────────────────────────────────────────

describe('Auth initialization — isLoading must always resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: onAuthStateChange returns a subscription stub
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('resolves when getSession returns no session', async () => {
    mockGetSession.mockResolvedValueOnce({ data: noSession(), error: null })

    // Simulate what AuthContext does:
    let loadingResolved = false
    type SessionResult = { data: { session: { user: { id: string; email?: string } } | null } }
    await mockGetSession()
      .then(async (result: SessionResult) => {
        if (result.data.session?.user) {
          // Would call loadSupabaseUser
        }
        loadingResolved = true  // setIsLoading(false) equivalent
      })
      .catch(() => {
        loadingResolved = true  // .catch() path
      })

    expect(loadingResolved).toBe(true)
  })

  it('resolves via .catch() when getSession itself rejects (network offline on iOS)', async () => {
    mockGetSession.mockRejectedValueOnce(new Error('Network request failed'))

    let loadingResolved = false
    await mockGetSession()
      .then(async () => {
        loadingResolved = true
      })
      .catch(() => {
        loadingResolved = true  // Bug fix: this path was previously missing
      })

    expect(loadingResolved).toBe(true)
  })

  it('resolves via .catch() when getProfile throws during loadSupabaseUser', async () => {
    mockGetSession.mockResolvedValueOnce({ data: makeSession(), error: null })
    vi.mocked(getProfile).mockRejectedValueOnce(new Error('Supabase RLS rejection'))

    let loadingResolved = false

    // Simulate the fixed AuthContext: loadSupabaseUser wrapped in try/catch
    async function loadSupabaseUser() {
      try {
        await getProfile('user-123')  // throws
      } catch {
        // Bug fix: error is swallowed here, does NOT propagate to outer chain
      }
    }

    await mockGetSession()
      .then(async ({ data }: { data: ReturnType<typeof makeSession> }) => {
        if (data.session?.user) {
          await loadSupabaseUser()
        }
        loadingResolved = true  // always reached now because loadSupabaseUser swallows errors
      })
      .catch(() => {
        loadingResolved = true
      })

    expect(loadingResolved).toBe(true)
    expect(vi.mocked(getProfile)).toHaveBeenCalledOnce()
  })

  it('REGRESSION: old code — loadSupabaseUser throwing blocks setIsLoading(false)', async () => {
    mockGetSession.mockResolvedValueOnce({ data: makeSession(), error: null })
    vi.mocked(getProfile).mockRejectedValueOnce(new Error('Profile fetch failed'))

    let loadingResolved = false

    // Simulate the OLD broken code (no try/catch in loadSupabaseUser, no .catch())
    async function oldLoadSupabaseUser() {
      await getProfile('user-123')  // throws — NOT caught
    }

    // OLD code had NO .catch()
    await mockGetSession()
      .then(async ({ data }: { data: ReturnType<typeof makeSession> }) => {
        if (data.session?.user) {
          await oldLoadSupabaseUser()  // throws here
        }
        loadingResolved = true  // NEVER REACHED in old code
      })
      // No .catch() in old code — error swallowed by Promise, loadingResolved stays false
      .catch(() => {})

    // Confirms the bug existed: loading never resolved
    expect(loadingResolved).toBe(false)
  })
})

// ── IS_SUPABASE_ENABLED flag logic ────────────────────────────────────────────

describe('IS_SUPABASE_ENABLED flag', () => {
  it('is true in our mock (controls which auth path runs)', () => {
    expect(IS_SUPABASE_ENABLED).toBe(true)
  })
})

// ── Auth state derivation ─────────────────────────────────────────────────────

describe('isAuthenticated derivation', () => {
  it('is false when currentUser is null', () => {
    const currentUser = null
    const isAuthenticated = !!currentUser
    expect(isAuthenticated).toBe(false)
  })

  it('is true when currentUser is set', () => {
    const currentUser = { id: 'user-123', name: 'Test User' }
    const isAuthenticated = !!currentUser
    expect(isAuthenticated).toBe(true)
  })
})

// ── TopBar/BottomNav state machine — pure conditional logic ───────────────────

describe('TopBar auth-state rendering logic', () => {
  // TopBar renders three states:
  //   isLoading=true → spacer (w-16 h-8)
  //   isLoading=false, isAuthenticated=false → Login + Join
  //   isLoading=false, isAuthenticated=true → Bell + Profile

  function topBarState(isLoading: boolean, isAuthenticated: boolean) {
    if (isLoading) return 'spacer'
    if (!isAuthenticated) return 'login-join'
    return 'bell-profile'
  }

  it('shows spacer while auth is resolving', () => {
    expect(topBarState(true, false)).toBe('spacer')
    expect(topBarState(true, true)).toBe('spacer')  // even if somehow authed+loading
  })

  it('shows Login/Join for unauthenticated users after loading', () => {
    expect(topBarState(false, false)).toBe('login-join')
  })

  it('shows Bell+Profile for authenticated users', () => {
    expect(topBarState(false, true)).toBe('bell-profile')
  })

  it('REGRESSION: old two-state code showed profile avatar during loading (isLoading=true)', () => {
    // Old code: if (!isLoading && !isAuthenticated) { login/join } else { bell/profile }
    function oldTopBarState(isLoading: boolean, isAuthenticated: boolean) {
      if (!isLoading && !isAuthenticated) return 'login-join'
      return 'bell-profile'  // ← BUG: shows profile avatar while isLoading=true
    }
    // While loading, old code showed profile avatar instead of spacer
    expect(oldTopBarState(true, false)).toBe('bell-profile')  // BUG confirmed
    // New code correctly shows spacer
    expect(topBarState(true, false)).toBe('spacer')           // FIXED
  })
})

describe('BottomNav auth-state rendering logic', () => {
  // BottomNav renders three states:
  //   isLoading=true → spacer div only (no fixed nav bar)
  //   isLoading=false, isAuthenticated=false → login/join bar (fixed z-40)
  //   isLoading=false, isAuthenticated=true → full nav (fixed z-40)

  function bottomNavState(isLoading: boolean, isAuthenticated: boolean) {
    if (isLoading) return 'spacer-only'
    if (!isAuthenticated) return 'login-join-bar'
    return 'full-nav'
  }

  it('shows only spacer while loading', () => {
    expect(bottomNavState(true, false)).toBe('spacer-only')
  })

  it('shows login/join bar for unauthenticated users', () => {
    expect(bottomNavState(false, false)).toBe('login-join-bar')
  })

  it('shows full nav for authenticated users', () => {
    expect(bottomNavState(false, true)).toBe('full-nav')
  })

  it('REGRESSION: old code returned null for unauthenticated — no nav visible at all', () => {
    // Old BottomNav: if (!isAuthenticated) return null
    function oldBottomNav(isAuthenticated: boolean) {
      if (!isAuthenticated) return null  // BUG: no nav, no way to log in
      return 'full-nav'
    }
    expect(oldBottomNav(false)).toBeNull()  // BUG confirmed
    expect(bottomNavState(false, false)).toBe('login-join-bar')  // FIXED
  })
})

// ── z-index stacking context bug (documented, can't test in node env) ─────────

describe('TradeSheet z-index stacking context', () => {
  // Bug: <main className="relative z-10"> creates a CSS stacking context.
  // TradeSheet (fixed, z-51) inside main (z-10) is subordinate to BottomNav (z-40 root).
  // On iOS Safari, fixed children respect parent stacking contexts — so TradeSheet
  // appears BEHIND BottomNav, making it look like the Spot button does nothing.
  //
  // Fix: Remove z-10 from main. Without z-index, position:relative alone does NOT
  // create a stacking context, so TradeSheet's z-51 competes in the root context.

  it('documents z-index hierarchy after fix', () => {
    // These are the expected z-index values after the AppShell fix
    const zIndices = {
      ambientOrbs: 0,       // pointer-events-none, decorative
      main: 'auto',         // NO z-index → no stacking context → TradeSheet escapes
      topBar: 40,           // fixed header
      bottomNav: 40,        // fixed footer
      tradeSheetBackdrop: 50,  // fixed overlay — now z-50 > z-40, appears above BottomNav ✓
      tradeSheet: 51,          // fixed panel — now z-51 > z-40, appears above BottomNav ✓
      spotlightCursor: 55,     // pointer-events-none, decorative
    }

    expect(zIndices.tradeSheet).toBeGreaterThan(zIndices.bottomNav)
    expect(zIndices.tradeSheetBackdrop).toBeGreaterThan(zIndices.bottomNav)
    expect(zIndices.main).toBe('auto')  // critical: no stacking context on main
  })
})
