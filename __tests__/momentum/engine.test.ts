import { aggregateScore, SIGNAL_WEIGHTS } from '@/lib/momentum/ScoreAggregator'
import type { InternalSignals, SignalResult } from '@/lib/momentum/types'

function makeSignal(normalized: number, weight: number): SignalResult {
  return { raw: normalized, normalized, weight, contribution: normalized * weight }
}

function buildSignals(normalizedValue: number): InternalSignals {
  return {
    spotVelocity: makeSignal(normalizedValue, SIGNAL_WEIGHTS.spotVelocity),
    spotCount: makeSignal(normalizedValue, SIGNAL_WEIGHTS.spotCount),
    shares: makeSignal(normalizedValue, SIGNAL_WEIGHTS.shares),
    views: makeSignal(normalizedValue, SIGNAL_WEIGHTS.views),
    rediscoveries: makeSignal(normalizedValue, SIGNAL_WEIGHTS.rediscoveries),
    searches: makeSignal(normalizedValue, SIGNAL_WEIGHTS.searches),
    communityPulse: makeSignal(normalizedValue, SIGNAL_WEIGHTS.communityPulse),
    discoveryNotes: makeSignal(normalizedValue, SIGNAL_WEIGHTS.discoveryNotes),
  }
}

describe('ScoreAggregator — aggregateScore', () => {
  it('returns 0 when all signals are 0', () => {
    expect(aggregateScore(buildSignals(0))).toBe(0)
  })

  it('returns 100 when all signals are at max', () => {
    expect(aggregateScore(buildSignals(100))).toBe(100)
  })

  it('returns a proportional score for mid-range signals', () => {
    const score = aggregateScore(buildSignals(50))
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
    // 50% of max = 50
    expect(score).toBeCloseTo(50, 0)
  })

  it('weights sum to exactly 1.0', () => {
    const sum = Object.values(SIGNAL_WEIGHTS).reduce((acc, w) => acc + w, 0)
    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('result is always between 0 and 100', () => {
    const score = aggregateScore(buildSignals(73))
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('higher signals produce higher scores (monotonic)', () => {
    const low = aggregateScore(buildSignals(20))
    const high = aggregateScore(buildSignals(80))
    expect(high).toBeGreaterThan(low)
  })

  // ── Breakout detection logic ─────────────────────────────────────────────
  // These tests verify the detection formula used in MomentumEngine,
  // expressed as pure logic here (no DB needed).

  describe('breakout detection', () => {
    function detectBreakout(spotVelocityNorm: number, rediscoveriesNorm: number): boolean {
      return (
        spotVelocityNorm > 60 ||
        (spotVelocityNorm > 40 && rediscoveriesNorm > 50)
      )
    }

    it('triggers breakout when spotVelocity > 60', () => {
      expect(detectBreakout(65, 0)).toBe(true)
    })

    it('triggers breakout when spotVelocity > 40 AND rediscoveries > 50', () => {
      expect(detectBreakout(45, 55)).toBe(true)
    })

    it('does NOT trigger breakout when both signals are low', () => {
      expect(detectBreakout(30, 30)).toBe(false)
    })

    it('does NOT trigger breakout when velocity is 40 but rediscoveries are 55 (boundary)', () => {
      // spotVelocity must be strictly > 40
      expect(detectBreakout(40, 55)).toBe(false)
    })

    it('does NOT trigger breakout when velocity > 40 but rediscoveries are exactly 50 (boundary)', () => {
      // rediscoveries must be strictly > 50
      expect(detectBreakout(45, 50)).toBe(false)
    })

    it('triggers breakout when velocity is exactly 61', () => {
      expect(detectBreakout(61, 0)).toBe(true)
    })
  })
})
