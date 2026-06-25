import {
  calculateSpotVelocity,
  calculateSpotCount,
  calculateShareScore,
  calculateViewScore,
  calculateRediscoveryScore,
  calculateSearchIntent,
  calculateCommunityPulse,
  calculateDiscoveryConviction,
} from '@/lib/momentum/InternalSignalProvider'

describe('InternalSignalProvider — signal calculators', () => {
  // ── calculateSpotVelocity ────────────────────────────────────────────────

  describe('calculateSpotVelocity', () => {
    it('returns 0 when all inputs are 0', () => {
      expect(calculateSpotVelocity(0, 0, 0)).toBe(0)
    })

    it('returns a positive value for non-zero inputs', () => {
      expect(calculateSpotVelocity(10, 50, 200)).toBeGreaterThan(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateSpotVelocity(10, 50, 200)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('is capped at 100 for very large inputs', () => {
      expect(calculateSpotVelocity(10_000, 50_000, 200_000)).toBeLessThanOrEqual(100)
    })

    it('higher 24h spots yield higher velocity than same count spread over 30d', () => {
      const high24h = calculateSpotVelocity(100, 0, 0)
      const low24h = calculateSpotVelocity(0, 0, 100)
      expect(high24h).toBeGreaterThan(low24h)
    })
  })

  // ── calculateSpotCount ───────────────────────────────────────────────────

  describe('calculateSpotCount', () => {
    it('returns 0 for 0 spotters', () => {
      expect(calculateSpotCount(0)).toBe(0)
    })

    it('returns ~100 for 10,000 spotters (cap)', () => {
      const result = calculateSpotCount(10_000)
      expect(result).toBeGreaterThanOrEqual(99)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateSpotCount(500)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('is monotonically increasing', () => {
      expect(calculateSpotCount(100)).toBeGreaterThan(calculateSpotCount(10))
      expect(calculateSpotCount(1000)).toBeGreaterThan(calculateSpotCount(100))
    })
  })

  // ── calculateShareScore ──────────────────────────────────────────────────

  describe('calculateShareScore', () => {
    it('returns 0 for 0 shares', () => {
      expect(calculateShareScore(0)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateShareScore(250)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('is capped at 100', () => {
      expect(calculateShareScore(10_000)).toBeLessThanOrEqual(100)
    })
  })

  // ── calculateViewScore ───────────────────────────────────────────────────

  describe('calculateViewScore', () => {
    it('returns 0 for 0 views', () => {
      expect(calculateViewScore(0)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateViewScore(2_500)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  })

  // ── calculateRediscoveryScore ────────────────────────────────────────────

  describe('calculateRediscoveryScore', () => {
    it('returns 0 for 0 rediscoveries', () => {
      expect(calculateRediscoveryScore(0)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateRediscoveryScore(50)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  })

  // ── calculateSearchIntent ────────────────────────────────────────────────

  describe('calculateSearchIntent', () => {
    it('returns 0 for 0 searchers', () => {
      expect(calculateSearchIntent(0)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateSearchIntent(100)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  })

  // ── calculateCommunityPulse ──────────────────────────────────────────────

  describe('calculateCommunityPulse', () => {
    it('returns 0 when there are no votes', () => {
      expect(calculateCommunityPulse(0, 0)).toBe(0)
    })

    it('returns 80 for 8 break_out votes out of 10 total', () => {
      expect(calculateCommunityPulse(8, 10)).toBe(80)
    })

    it('returns 100 for all break_out votes', () => {
      expect(calculateCommunityPulse(10, 10)).toBe(100)
    })

    it('returns 0 for 0 break_out votes with non-zero total', () => {
      expect(calculateCommunityPulse(0, 10)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateCommunityPulse(3, 7)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  })

  // ── calculateDiscoveryConviction ─────────────────────────────────────────

  describe('calculateDiscoveryConviction', () => {
    it('returns 0 for 0 notes', () => {
      expect(calculateDiscoveryConviction(0)).toBe(0)
    })

    it('returns a value between 0 and 100', () => {
      const result = calculateDiscoveryConviction(25)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('is capped at 100', () => {
      expect(calculateDiscoveryConviction(10_000)).toBeLessThanOrEqual(100)
    })
  })

  // ── General invariants ───────────────────────────────────────────────────

  describe('general invariants — all normalized values must be 0-100', () => {
    const fns = [
      () => calculateSpotVelocity(5, 20, 100),
      () => calculateSpotCount(1234),
      () => calculateShareScore(42),
      () => calculateViewScore(300),
      () => calculateRediscoveryScore(12),
      () => calculateSearchIntent(88),
      () => calculateCommunityPulse(6, 9),
      () => calculateDiscoveryConviction(7),
    ]

    fns.forEach((fn, i) => {
      it(`function[${i}] returns value in [0, 100]`, () => {
        const val = fn()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(100)
      })
    })
  })
})
