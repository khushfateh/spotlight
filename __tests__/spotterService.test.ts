/**
 * spotterService.test.ts
 *
 * Tests for the Permanent Spotter Number system.
 * Uses vitest + vi.mock to stub @/lib/supabase/client.
 *
 * Install: npm install --save-dev vitest
 * Run:     npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { spotCreator, moveOnCreator, getRelationship, getUserCollection } from '@/lib/services/spotterService'

// ── Mock Supabase client ──────────────────────────────────────────────────────

const { mockRpc, mockFrom } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  IS_SUPABASE_ENABLED: true,
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}))

// ── Shared fixtures ───────────────────────────────────────────────────────────

const USER_A = 'user-aaa-111'
const USER_B = 'user-bbb-222'
const CREATOR_ID = 'creator-xyz-001'
const TICKER = 'APDHILLON'

function makeFromChain(overrides: Partial<{
  data: unknown
  error: { message: string } | null
  count: number | null
}> = {}) {
  const { data = null, error = null } = overrides
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    order: vi.fn().mockReturnThis(),
  }
  return chain
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('spotCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves creator id before calling RPC', async () => {
    // First call: creators lookup
    const creatorsChain = makeFromChain({ data: { id: CREATOR_ID } })
    mockFrom.mockReturnValueOnce(creatorsChain)
    // RPC returns first-time spot
    mockRpc.mockResolvedValueOnce({
      data: { spotter_number: 1, card_status: 'active' },
      error: null,
    })

    const result = await spotCreator(USER_A, TICKER)

    expect(mockFrom).toHaveBeenCalledWith('creators')
    expect(creatorsChain.eq).toHaveBeenCalledWith('ticker', TICKER.toUpperCase())
    expect(mockRpc).toHaveBeenCalledWith('spot_or_rediscover', {
      p_user_id: USER_A,
      p_creator_id: CREATOR_ID,
    })
    expect(result).toEqual({ spotterNumber: 1, cardStatus: 'active' })
  })

  it('assigns sequential spotter numbers to different users', async () => {
    // User A: Spotter #1
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'active' }, error: null })
    const resultA = await spotCreator(USER_A, TICKER)

    // User B: Spotter #2
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 2, card_status: 'active' }, error: null })
    const resultB = await spotCreator(USER_B, TICKER)

    expect(resultA?.spotterNumber).toBe(1)
    expect(resultB?.spotterNumber).toBe(2)
  })

  it('returns null when creator ticker is not found', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: null }))
    const result = await spotCreator(USER_A, 'UNKNOWN')
    expect(result).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns null and logs error when RPC fails', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } })
    const result = await spotCreator(USER_A, TICKER)
    expect(result).toBeNull()
  })

  it('is idempotent — already-spotted returns current status without new number', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'active' }, error: null })
    const result = await spotCreator(USER_A, TICKER)
    expect(result?.spotterNumber).toBe(1)
    expect(result?.cardStatus).toBe('active')
  })

  it('returns card_status=rediscovered on second spot after move-on', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 3, card_status: 'rediscovered' }, error: null })
    const result = await spotCreator(USER_A, TICKER)
    expect(result?.spotterNumber).toBe(3)
    expect(result?.cardStatus).toBe('rediscovered')
  })

  it('preserves original spotter number on rediscovery (no new number assigned)', async () => {
    // First spot
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 5, card_status: 'active' }, error: null })
    const first = await spotCreator(USER_A, TICKER)

    // Rediscovery — RPC returns same number 5, not 6
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 5, card_status: 'rediscovered' }, error: null })
    const rediscovery = await spotCreator(USER_A, TICKER)

    expect(first?.spotterNumber).toBe(5)
    expect(rediscovery?.spotterNumber).toBe(5)
  })
})

describe('moveOnCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls move_on_creator RPC with correct args', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'moved_on' }, error: null })

    const result = await moveOnCreator(USER_A, TICKER, 42)

    expect(mockRpc).toHaveBeenCalledWith('move_on_creator', {
      p_user_id: USER_A,
      p_creator_id: CREATOR_ID,
      p_duration_days: 42,
    })
    expect(result).toEqual({ spotterNumber: 1, cardStatus: 'moved_on' })
  })

  it('preserves spotter number after move-on', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 7, card_status: 'moved_on' }, error: null })
    const result = await moveOnCreator(USER_A, TICKER, 14)
    expect(result?.spotterNumber).toBe(7)
    expect(result?.cardStatus).toBe('moved_on')
  })

  it('is idempotent when already moved on', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 2, card_status: 'moved_on' }, error: null })
    const result = await moveOnCreator(USER_A, TICKER, 0)
    expect(result?.cardStatus).toBe('moved_on')
  })

  it('returns null when creator not found', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: null }))
    const result = await moveOnCreator(USER_A, 'UNKNOWN', 10)
    expect(result).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('getRelationship', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no relationship exists', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    // user_artist_spots query returns null
    mockFrom.mockReturnValueOnce(makeFromChain({ data: null, error: { message: 'no rows' } }))
    const result = await getRelationship(USER_A, TICKER)
    expect(result).toBeNull()
  })

  it('maps row to SpotRelationship with correct cardStatus=active', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockFrom.mockReturnValueOnce(makeFromChain({
      data: {
        id: 'rel-001',
        creator_id: CREATOR_ID,
        spotter_number: 4,
        first_spotted_at: '2026-01-01T00:00:00Z',
        first_moved_on_at: null,
        latest_spotted_at: '2026-01-01T00:00:00Z',
        latest_moved_on_at: null,
        is_currently_spotted: true,
        has_ever_moved_on: false,
        has_rediscovered: false,
        rediscovered_at: null,
        creators: { ticker: TICKER, name: 'AP Dhillon', image_url: null },
      },
    }))

    const result = await getRelationship(USER_A, TICKER)
    expect(result).not.toBeNull()
    expect(result?.spotterNumber).toBe(4)
    expect(result?.cardStatus).toBe('active')
    expect(result?.isCurrentlySpotted).toBe(true)
    expect(result?.hasRediscovered).toBe(false)
  })

  it('maps cardStatus=moved_on when not currently spotted', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockFrom.mockReturnValueOnce(makeFromChain({
      data: {
        id: 'rel-002',
        creator_id: CREATOR_ID,
        spotter_number: 4,
        first_spotted_at: '2026-01-01T00:00:00Z',
        first_moved_on_at: '2026-03-01T00:00:00Z',
        latest_spotted_at: '2026-01-01T00:00:00Z',
        latest_moved_on_at: '2026-03-01T00:00:00Z',
        is_currently_spotted: false,
        has_ever_moved_on: true,
        has_rediscovered: false,
        rediscovered_at: null,
        creators: { ticker: TICKER, name: 'AP Dhillon', image_url: null },
      },
    }))

    const result = await getRelationship(USER_A, TICKER)
    expect(result?.cardStatus).toBe('moved_on')
    expect(result?.firstMovedOnAt).toBeInstanceOf(Date)
  })

  it('maps cardStatus=rediscovered when is_currently_spotted=true AND has_rediscovered=true', async () => {
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockFrom.mockReturnValueOnce(makeFromChain({
      data: {
        id: 'rel-003',
        creator_id: CREATOR_ID,
        spotter_number: 4,
        first_spotted_at: '2026-01-01T00:00:00Z',
        first_moved_on_at: '2026-03-01T00:00:00Z',
        latest_spotted_at: '2026-05-01T00:00:00Z',
        latest_moved_on_at: '2026-03-01T00:00:00Z',
        is_currently_spotted: true,
        has_ever_moved_on: true,
        has_rediscovered: true,
        rediscovered_at: '2026-05-01T00:00:00Z',
        creators: { ticker: TICKER, name: 'AP Dhillon', image_url: null },
      },
    }))

    const result = await getRelationship(USER_A, TICKER)
    expect(result?.cardStatus).toBe('rediscovered')
    expect(result?.hasRediscovered).toBe(true)
    expect(result?.rediscoveredAt).toBeInstanceOf(Date)
  })

  it('first_spotted_at is immutable — remains original date after rediscovery', async () => {
    const originalDate = '2026-01-01T00:00:00Z'
    const rediscoveryDate = '2026-05-01T00:00:00Z'

    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockFrom.mockReturnValueOnce(makeFromChain({
      data: {
        id: 'rel-004',
        creator_id: CREATOR_ID,
        spotter_number: 4,
        first_spotted_at: originalDate,
        first_moved_on_at: '2026-03-01T00:00:00Z',
        latest_spotted_at: rediscoveryDate,
        latest_moved_on_at: null,
        is_currently_spotted: true,
        has_ever_moved_on: true,
        has_rediscovered: true,
        rediscovered_at: rediscoveryDate,
        creators: { ticker: TICKER, name: 'AP Dhillon', image_url: null },
      },
    }))

    const result = await getRelationship(USER_A, TICKER)
    expect(result?.firstSpottedAt.getTime()).toBe(new Date(originalDate).getTime())
    expect(result?.latestSpottedAt.getTime()).toBe(new Date(rediscoveryDate).getTime())
    // firstSpottedAt must not equal latestSpottedAt after rediscovery
    expect(result?.firstSpottedAt.getTime()).not.toBe(result?.latestSpottedAt.getTime())
  })
})

describe('getUserCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeRel = (overrides: {
    id: string
    spotter_number: number
    is_currently_spotted: boolean
    has_rediscovered: boolean
    ticker?: string
  }) => ({
    id: overrides.id,
    creator_id: CREATOR_ID,
    spotter_number: overrides.spotter_number,
    first_spotted_at: '2026-01-01T00:00:00Z',
    first_moved_on_at: overrides.is_currently_spotted ? null : '2026-03-01T00:00:00Z',
    latest_spotted_at: '2026-01-01T00:00:00Z',
    latest_moved_on_at: null,
    is_currently_spotted: overrides.is_currently_spotted,
    has_ever_moved_on: !overrides.is_currently_spotted,
    has_rediscovered: overrides.has_rediscovered,
    rediscovered_at: overrides.has_rediscovered ? '2026-05-01T00:00:00Z' : null,
    creators: { ticker: overrides.ticker ?? TICKER, name: 'Test Artist', image_url: null },
  })

  it('partitions rows into active, movedOn, rediscovered collections', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          makeRel({ id: 'r1', spotter_number: 1, is_currently_spotted: true, has_rediscovered: false, ticker: 'ARTA' }),
          makeRel({ id: 'r2', spotter_number: 2, is_currently_spotted: false, has_rediscovered: false, ticker: 'ARTB' }),
          makeRel({ id: 'r3', spotter_number: 3, is_currently_spotted: true, has_rediscovered: true, ticker: 'ARTC' }),
        ],
        error: null,
      }),
    })

    const result = await getUserCollection(USER_A)

    expect(result.active).toHaveLength(1)
    expect(result.active[0].ticker).toBe('ARTA')

    expect(result.movedOn).toHaveLength(1)
    expect(result.movedOn[0].ticker).toBe('ARTB')

    expect(result.rediscovered).toHaveLength(1)
    expect(result.rediscovered[0].ticker).toBe('ARTC')
    expect(result.rediscovered[0].cardStatus).toBe('rediscovered')
  })

  it('rediscovered collection is permanent — appears even if later moved on again', async () => {
    // A user who rediscovered ARTC and then moved on again:
    // is_currently_spotted=false, has_rediscovered=true
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'r4',
            creator_id: CREATOR_ID,
            spotter_number: 3,
            first_spotted_at: '2026-01-01T00:00:00Z',
            first_moved_on_at: '2026-03-01T00:00:00Z',
            latest_spotted_at: '2026-05-01T00:00:00Z',
            latest_moved_on_at: '2026-06-01T00:00:00Z',
            is_currently_spotted: false,     // moved on again
            has_ever_moved_on: true,
            has_rediscovered: true,          // but rediscovery record is permanent
            rediscovered_at: '2026-05-01T00:00:00Z',
            creators: { ticker: 'ARTC', name: 'Test', image_url: null },
          },
        ],
        error: null,
      }),
    })

    const result = await getUserCollection(USER_A)

    expect(result.rediscovered).toHaveLength(1)
    expect(result.rediscovered[0].ticker).toBe('ARTC')

    expect(result.movedOn).toHaveLength(1)  // also appears in moved-on

    expect(result.active).toHaveLength(0)
  })

  it('returns empty collections when supabase returns no data', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
    })
    const result = await getUserCollection(USER_A)
    expect(result).toEqual({ active: [], movedOn: [], rediscovered: [] })
  })
})

describe('Spotter Number uniqueness invariants', () => {
  it('two different users cannot have the same spotter number for the same creator', async () => {
    // Simulate RPC assigning sequential numbers
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 10, card_status: 'active' }, error: null })
    const a = await spotCreator(USER_A, TICKER)

    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 11, card_status: 'active' }, error: null })
    const b = await spotCreator(USER_B, TICKER)

    expect(a?.spotterNumber).not.toBe(b?.spotterNumber)
  })

  it('artist counters are NOT incremented on rediscovery (same spotter number)', async () => {
    // First spot: counter goes 1 → 2
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'active' }, error: null })
    const first = await spotCreator(USER_A, TICKER)

    // Move on
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'moved_on' }, error: null })
    await moveOnCreator(USER_A, TICKER, 30)

    // Rediscovery: counter stays at 2 (same number returned)
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 1, card_status: 'rediscovered' }, error: null })
    const rediscovery = await spotCreator(USER_A, TICKER)

    // Number must not have changed
    expect(rediscovery?.spotterNumber).toBe(first?.spotterNumber)

    // New user after all this: gets number 2 (counter didn't increment on rediscovery)
    mockFrom.mockReturnValueOnce(makeFromChain({ data: { id: CREATOR_ID } }))
    mockRpc.mockResolvedValueOnce({ data: { spotter_number: 2, card_status: 'active' }, error: null })
    const newUser = await spotCreator(USER_B, TICKER)
    expect(newUser?.spotterNumber).toBe(2)
  })
})
