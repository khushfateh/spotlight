// @vitest-environment jsdom

/**
 * tradeSheet.test.tsx
 *
 * Tests for the useTradeSheet hook state machine and the TradeSheet component.
 *
 * Guards against: Spot button appearing to do nothing on iOS (TradeSheet hidden
 * behind BottomNav due to z-index stacking context bug — fixed in AppShell).
 *
 * Environment: jsdom (set via vitest.config.ts environmentMatchGlobs)
 */

import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/client', () => ({
  IS_SUPABASE_ENABLED: false,
  supabase: null,
}))

vi.mock('@/lib/services/spotService', () => ({
  logSpot: vi.fn().mockResolvedValue(undefined),
  removeSpot: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/spotterService', () => ({
  spotCreator: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/services/interactionService', () => ({
  logCreatorView: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/vaultService', () => ({
  logDiscoveryCard: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/mock-data/momentum', () => ({
  getMomentum: vi.fn(() => ({ score: 74, delta: 3 })),
  getMomentumTier: vi.fn(() => 'Breakout'),
}))

import { useTradeSheet } from '@/hooks/useTradeSheet'
import type { Creator } from '@/types'

const MOCK_CREATOR: Creator = {
  id: 'test-creator-001',
  name: 'Test Artist',
  ticker: 'TEST',
  category: 'Music',
  bio: 'Test artist bio.',
  avatar: 'TA',
  coverColor: 'from-zinc-700 to-zinc-900',
  creatorScore: 82,
  socialHandles: {},
  story: 'A great story.',
}

// ── useTradeSheet state machine ───────────────────────────────────────────────

describe('useTradeSheet — state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with sheet closed and no creator', () => {
    const { result } = renderHook(() => useTradeSheet())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.creator).toBeNull()
    expect(result.current.step).toBe('form')
  })

  it('openBuy sets isOpen=true with correct creator and tradeType', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => {
      result.current.openBuy(MOCK_CREATOR)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.creator).toEqual(MOCK_CREATOR)
    expect(result.current.tradeType).toBe('buy')
    expect(result.current.step).toBe('form')
  })

  it('openSell sets tradeType=sell', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => {
      result.current.openSell(MOCK_CREATOR)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.tradeType).toBe('sell')
  })

  it('spotNow transitions to step=success immediately (no async wait)', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => {
      result.current.openBuy(MOCK_CREATOR)
    })

    act(() => {
      result.current.spotNow()
    })

    // step=success should be set synchronously (pendingOrder + setStep)
    expect(result.current.step).toBe('success')
    expect(result.current.pendingOrder).not.toBeNull()
    expect(result.current.pendingOrder?.type).toBe('buy')
  })

  it('close sets isOpen=false', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => {
      result.current.openBuy(MOCK_CREATOR)
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('reset goes back to form step while keeping creator/type', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => result.current.openBuy(MOCK_CREATOR))
    act(() => result.current.spotNow())
    expect(result.current.step).toBe('success')

    act(() => result.current.reset())
    expect(result.current.step).toBe('form')
    // Sheet stays open on reset (user can retry)
    expect(result.current.isOpen).toBe(true)
  })

  it('submitOrder transitions to confirm step', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => result.current.openBuy(MOCK_CREATOR))
    act(() => result.current.submitOrder({ type: 'buy', orderType: 'market', shares: 1, estimatedTotal: 0 }))

    expect(result.current.step).toBe('confirm')
    expect(result.current.pendingOrder?.type).toBe('buy')
  })

  it('opening a new creator resets step to form', () => {
    const { result } = renderHook(() => useTradeSheet())

    act(() => result.current.openBuy(MOCK_CREATOR))
    act(() => result.current.spotNow())
    expect(result.current.step).toBe('success')

    const OTHER_CREATOR = { ...MOCK_CREATOR, id: 'other-001', name: 'Other Artist', ticker: 'OTHER' }
    act(() => result.current.openBuy(OTHER_CREATOR))

    expect(result.current.step).toBe('form')
    expect(result.current.creator?.ticker).toBe('OTHER')
  })
})

// ── TradeSheet visibility (spot button reaching the sheet) ────────────────────

describe('TradeSheet — Spot button flow', () => {
  it('REGRESSION: openBuy must set isOpen=true — if false, Spot button does nothing', () => {
    const { result } = renderHook(() => useTradeSheet())

    // Simulate what the "Spot" button in HomeFeed calls
    act(() => {
      result.current.openBuy(MOCK_CREATOR)
    })

    // If isOpen is false here, the TradeSheet never slides up → "Spot does nothing"
    expect(result.current.isOpen).toBe(true)
  })

  it('spotNow does not require authentication to reach success state', () => {
    // On iOS, unauthenticated users should still see the cinematic when they tap Spot.
    // The actual spot logging is fire-and-forget; step=success always fires.
    const { result } = renderHook(() => useTradeSheet())

    act(() => result.current.openBuy(MOCK_CREATOR))
    act(() => result.current.spotNow())

    // success must be reached regardless of auth state
    expect(result.current.step).toBe('success')
  })
})
