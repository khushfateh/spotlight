/**
 * InternalSignalProvider
 * Pure functions that normalize raw DB signals to 0-100 scores.
 * All functions are deterministic and side-effect free — easy to unit test.
 */

function cap100(n: number): number {
  return Math.min(100, Math.max(0, n))
}

/**
 * Spot Velocity — weighted blend of 24h / 7d / 30d new spots, log-scaled.
 * Weight: 0.5 / 0.3 / 0.2 for recency.
 */
export function calculateSpotVelocity(
  spots24h: number,
  spots7d: number,
  spots30d: number,
): number {
  const weighted = spots24h * 0.5 + spots7d * 0.3 + spots30d * 0.2
  return cap100(Math.log1p(weighted) / Math.log1p(100) * 100)
}

/**
 * Spot Count — total active spotters, log-scaled against cap of 10,000.
 */
export function calculateSpotCount(activeSpotters: number): number {
  return cap100(Math.log1p(activeSpotters) / Math.log1p(10_000) * 100)
}

/**
 * Share Score — total shares in last 30 days, log-scaled against cap of 500.
 */
export function calculateShareScore(shares30d: number): number {
  return cap100(Math.log1p(shares30d) / Math.log1p(500) * 100)
}

/**
 * View Score — unique users who viewed in last 30 days, log-scaled against cap of 5,000.
 */
export function calculateViewScore(uniqueViews30d: number): number {
  return cap100(Math.log1p(uniqueViews30d) / Math.log1p(5_000) * 100)
}

/**
 * Rediscovery Score — rediscoveries in last 90 days, log-scaled against cap of 100.
 */
export function calculateRediscoveryScore(rediscoveries90d: number): number {
  return cap100(Math.log1p(rediscoveries90d) / Math.log1p(100) * 100)
}

/**
 * Search Intent — unique searchers in last 30 days, log-scaled against cap of 200.
 */
export function calculateSearchIntent(uniqueSearchers30d: number): number {
  return cap100(Math.log1p(uniqueSearchers30d) / Math.log1p(200) * 100)
}

/**
 * Community Pulse — percentage of 'will_break_out' votes out of all votes * 100.
 * Returns 0 when there are no votes.
 */
export function calculateCommunityPulse(
  willBreakOutVotes: number,
  totalVotes: number,
): number {
  if (totalVotes === 0) return 0
  return cap100((willBreakOutVotes / totalVotes) * 100)
}

/**
 * Discovery Conviction — notes written during Spot in last 30 days, log-scaled against cap of 50.
 */
export function calculateDiscoveryConviction(notes30d: number): number {
  return cap100(Math.log1p(notes30d) / Math.log1p(50) * 100)
}
