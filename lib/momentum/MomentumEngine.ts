import type { SupabaseClient } from '@supabase/supabase-js'
import type { MomentumScore, InternalSignals, SignalResult } from './types'
import {
  calculateSpotVelocity,
  calculateSpotCount,
  calculateShareScore,
  calculateViewScore,
  calculateRediscoveryScore,
  calculateSearchIntent,
  calculateCommunityPulse,
  calculateDiscoveryConviction,
} from './InternalSignalProvider'
import { aggregateScore, SIGNAL_WEIGHTS } from './ScoreAggregator'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSignalResult(raw: number, normalized: number, weight: number): SignalResult {
  return { raw, normalized, weight, contribution: normalized * weight }
}

// ── Single-creator calculation ────────────────────────────────────────────────

export async function calculateMomentum(
  db: SupabaseClient,
  creatorId: string,
  ticker: string,
): Promise<MomentumScore> {
  const now = new Date()
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ago90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all signals in parallel
  const [
    spots24hRes,
    spots7dRes,
    spots30dRes,
    counterRes,
    shares30dRes,
    views30dRes,
    rediscoveries90dRes,
    searches30dRes,
    pulseRes,
    notes30dRes,
  ] = await Promise.all([
    // Spot velocity signals
    db
      .from('user_artist_spots')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('latest_spotted_at', ago24h),
    db
      .from('user_artist_spots')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('latest_spotted_at', ago7d),
    db
      .from('user_artist_spots')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('latest_spotted_at', ago30d),
    // Active spotter count from counters table
    db
      .from('artist_spot_counters')
      .select('total_spotter_count')
      .eq('creator_id', creatorId)
      .maybeSingle(),
    // Shares in 30d
    db
      .from('share_cards')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', ago30d),
    // Unique views in 30d (count rows — dedup by user+day would require SQL view)
    db
      .from('creator_views')
      .select('user_id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('viewed_at', ago30d),
    // Rediscoveries in 90d
    db
      .from('user_artist_spots')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('has_rediscovered', true)
      .gte('rediscovered_at', ago90d),
    // Unique searchers in 30d
    db
      .from('creator_searches')
      .select('user_id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('searched_at', ago30d),
    // Community pulse votes
    db
      .from('creator_pulse_votes')
      .select('vote_type')
      .eq('creator_id', creatorId),
    // Discovery notes in 30d
    db
      .from('discovery_notes')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .gte('created_at', ago30d),
  ])

  // Extract counts (gracefully default to 0 on error)
  const spots24h = spots24hRes.count ?? 0
  const spots7d = spots7dRes.count ?? 0
  const spots30d = spots30dRes.count ?? 0
  const activeSpotters = (counterRes.data as { total_spotter_count: number } | null)?.total_spotter_count ?? 0
  const shares30d = shares30dRes.count ?? 0
  const uniqueViews30d = views30dRes.count ?? 0
  const rediscoveries90d = rediscoveries90dRes.count ?? 0
  const uniqueSearchers30d = searches30dRes.count ?? 0
  const notes30d = notes30dRes.count ?? 0

  // Community pulse: count will_break_out vs total
  const pulseRows = (pulseRes.data ?? []) as { vote_type: string }[]
  const totalVotes = pulseRows.length
  const willBreakOutVotes = pulseRows.filter(r => r.vote_type === 'will_break_out').length

  // Normalize each signal
  const spotVelocityNorm = calculateSpotVelocity(spots24h, spots7d, spots30d)
  const spotCountNorm = calculateSpotCount(activeSpotters)
  const sharesNorm = calculateShareScore(shares30d)
  const viewsNorm = calculateViewScore(uniqueViews30d)
  const rediscoveriesNorm = calculateRediscoveryScore(rediscoveries90d)
  const searchesNorm = calculateSearchIntent(uniqueSearchers30d)
  const pulseNorm = calculateCommunityPulse(willBreakOutVotes, totalVotes)
  const notesNorm = calculateDiscoveryConviction(notes30d)

  const signals: InternalSignals = {
    spotVelocity: makeSignalResult(spots24h * 0.5 + spots7d * 0.3 + spots30d * 0.2, spotVelocityNorm, SIGNAL_WEIGHTS.spotVelocity),
    spotCount: makeSignalResult(activeSpotters, spotCountNorm, SIGNAL_WEIGHTS.spotCount),
    shares: makeSignalResult(shares30d, sharesNorm, SIGNAL_WEIGHTS.shares),
    views: makeSignalResult(uniqueViews30d, viewsNorm, SIGNAL_WEIGHTS.views),
    rediscoveries: makeSignalResult(rediscoveries90d, rediscoveriesNorm, SIGNAL_WEIGHTS.rediscoveries),
    searches: makeSignalResult(uniqueSearchers30d, searchesNorm, SIGNAL_WEIGHTS.searches),
    communityPulse: makeSignalResult(willBreakOutVotes, pulseNorm, SIGNAL_WEIGHTS.communityPulse),
    discoveryNotes: makeSignalResult(notes30d, notesNorm, SIGNAL_WEIGHTS.discoveryNotes),
  }

  const score = aggregateScore(signals)

  // Breakout detection
  const breakout =
    spotVelocityNorm > 60 ||
    (spotVelocityNorm > 40 && rediscoveriesNorm > 50)

  return {
    ticker,
    creatorId,
    score,
    signals,
    breakout,
    generatedAt: now.toISOString(),
  }
}

// ── All-creators batch calculation ───────────────────────────────────────────

type CreatorRow = { id: string; ticker: string }

export async function calculateAllMomentum(db: SupabaseClient): Promise<MomentumScore[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: creatorsData, error: creatorsError } = await (db as any)
    .from('creators')
    .select('id, ticker')
    .not('spotify_last_synced_at', 'is', null)

  if (creatorsError || !creatorsData?.length) return []

  const rows = creatorsData as CreatorRow[]
  const creatorIds = rows.map(r => r.id)
  const now = new Date()
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ago90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Batch-fetch all signals at once to avoid N+1 queries
  const [
    spots24hRes,
    spots7dRes,
    spots30dRes,
    countersRes,
    shares30dRes,
    views30dRes,
    rediscoveries90dRes,
    searches30dRes,
    pulseRes,
    notes30dRes,
  ] = await Promise.all([
    db
      .from('user_artist_spots')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('latest_spotted_at', ago24h),
    db
      .from('user_artist_spots')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('latest_spotted_at', ago7d),
    db
      .from('user_artist_spots')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('latest_spotted_at', ago30d),
    db
      .from('artist_spot_counters')
      .select('creator_id, total_spotter_count')
      .in('creator_id', creatorIds),
    db
      .from('share_cards')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('created_at', ago30d),
    db
      .from('creator_views')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('viewed_at', ago30d),
    db
      .from('user_artist_spots')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .eq('has_rediscovered', true)
      .gte('rediscovered_at', ago90d),
    db
      .from('creator_searches')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('searched_at', ago30d),
    db
      .from('creator_pulse_votes')
      .select('creator_id, vote_type')
      .in('creator_id', creatorIds),
    db
      .from('discovery_notes')
      .select('creator_id')
      .in('creator_id', creatorIds)
      .gte('created_at', ago30d),
  ])

  // Group results in memory by creator_id
  type WithCreatorId = { creator_id: string }
  function groupCount(data: unknown[] | null | undefined): Map<string, number> {
    const m = new Map<string, number>()
    if (!data) return m
    for (const row of data as WithCreatorId[]) {
      m.set(row.creator_id, (m.get(row.creator_id) ?? 0) + 1)
    }
    return m
  }

  const spots24hMap = groupCount(spots24hRes.data)
  const spots7dMap = groupCount(spots7dRes.data)
  const spots30dMap = groupCount(spots30dRes.data)
  const shares30dMap = groupCount(shares30dRes.data)
  const views30dMap = groupCount(views30dRes.data)
  const rediscoveries90dMap = groupCount(rediscoveries90dRes.data)
  const searches30dMap = groupCount(searches30dRes.data)
  const notes30dMap = groupCount(notes30dRes.data)

  // Counter map
  const counterMap = new Map<string, number>()
  for (const row of (countersRes.data ?? []) as { creator_id: string; total_spotter_count: number }[]) {
    counterMap.set(row.creator_id, row.total_spotter_count)
  }

  // Pulse maps
  type PulseRow = { creator_id: string; vote_type: string }
  const pulseTotal = new Map<string, number>()
  const pulseBreakout = new Map<string, number>()
  for (const row of (pulseRes.data ?? []) as PulseRow[]) {
    pulseTotal.set(row.creator_id, (pulseTotal.get(row.creator_id) ?? 0) + 1)
    if (row.vote_type === 'will_break_out') {
      pulseBreakout.set(row.creator_id, (pulseBreakout.get(row.creator_id) ?? 0) + 1)
    }
  }

  // Compute scores for each creator
  return rows.map(creator => {
    const cid = creator.id

    const s24h = spots24hMap.get(cid) ?? 0
    const s7d = spots7dMap.get(cid) ?? 0
    const s30d = spots30dMap.get(cid) ?? 0
    const activeSpotters = counterMap.get(cid) ?? 0
    const shares30d = shares30dMap.get(cid) ?? 0
    const uniqueViews30d = views30dMap.get(cid) ?? 0
    const rediscoveries90d = rediscoveries90dMap.get(cid) ?? 0
    const uniqueSearchers30d = searches30dMap.get(cid) ?? 0
    const notes30d = notes30dMap.get(cid) ?? 0
    const totalVotes = pulseTotal.get(cid) ?? 0
    const willBreakOutVotes = pulseBreakout.get(cid) ?? 0

    const spotVelocityNorm = calculateSpotVelocity(s24h, s7d, s30d)
    const spotCountNorm = calculateSpotCount(activeSpotters)
    const sharesNorm = calculateShareScore(shares30d)
    const viewsNorm = calculateViewScore(uniqueViews30d)
    const rediscoveriesNorm = calculateRediscoveryScore(rediscoveries90d)
    const searchesNorm = calculateSearchIntent(uniqueSearchers30d)
    const pulseNorm = calculateCommunityPulse(willBreakOutVotes, totalVotes)
    const notesNorm = calculateDiscoveryConviction(notes30d)

    const signals: InternalSignals = {
      spotVelocity: makeSignalResult(s24h * 0.5 + s7d * 0.3 + s30d * 0.2, spotVelocityNorm, SIGNAL_WEIGHTS.spotVelocity),
      spotCount: makeSignalResult(activeSpotters, spotCountNorm, SIGNAL_WEIGHTS.spotCount),
      shares: makeSignalResult(shares30d, sharesNorm, SIGNAL_WEIGHTS.shares),
      views: makeSignalResult(uniqueViews30d, viewsNorm, SIGNAL_WEIGHTS.views),
      rediscoveries: makeSignalResult(rediscoveries90d, rediscoveriesNorm, SIGNAL_WEIGHTS.rediscoveries),
      searches: makeSignalResult(uniqueSearchers30d, searchesNorm, SIGNAL_WEIGHTS.searches),
      communityPulse: makeSignalResult(willBreakOutVotes, pulseNorm, SIGNAL_WEIGHTS.communityPulse),
      discoveryNotes: makeSignalResult(notes30d, notesNorm, SIGNAL_WEIGHTS.discoveryNotes),
    }

    const score = aggregateScore(signals)
    const breakout = spotVelocityNorm > 60 || (spotVelocityNorm > 40 && rediscoveriesNorm > 50)

    return {
      ticker: creator.ticker,
      creatorId: cid,
      score,
      signals,
      breakout,
      generatedAt: now.toISOString(),
    }
  })
}
