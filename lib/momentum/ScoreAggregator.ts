import type { InternalSignals } from './types'

export const SIGNAL_WEIGHTS = {
  spotVelocity: 0.30,
  spotCount: 0.22,
  shares: 0.18,
  views: 0.12,
  rediscoveries: 0.09,
  searches: 0.06,
  communityPulse: 0.02,
  discoveryNotes: 0.01,
} as const

// Phase 2: when external signals are added, internal = 60%, external = 40%
export const PHASE = 1 // increment when external signals go live

/**
 * Aggregate all internal signals into a single 0-100 momentum score.
 * Each signal's normalized value (0-100) is multiplied by its weight,
 * and the contributions are summed. Result is capped to [0, 100].
 */
export function aggregateScore(signals: InternalSignals): number {
  const total =
    signals.spotVelocity.normalized * SIGNAL_WEIGHTS.spotVelocity +
    signals.spotCount.normalized * SIGNAL_WEIGHTS.spotCount +
    signals.shares.normalized * SIGNAL_WEIGHTS.shares +
    signals.views.normalized * SIGNAL_WEIGHTS.views +
    signals.rediscoveries.normalized * SIGNAL_WEIGHTS.rediscoveries +
    signals.searches.normalized * SIGNAL_WEIGHTS.searches +
    signals.communityPulse.normalized * SIGNAL_WEIGHTS.communityPulse +
    signals.discoveryNotes.normalized * SIGNAL_WEIGHTS.discoveryNotes

  return Math.min(100, Math.max(0, Math.round(total * 10) / 10))
}
