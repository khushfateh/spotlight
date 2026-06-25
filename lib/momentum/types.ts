export type SignalResult = {
  raw: number        // raw value before normalization
  normalized: number // 0-100
  weight: number     // 0-1
  contribution: number // normalized * weight
}

export type InternalSignals = {
  spotVelocity: SignalResult
  spotCount: SignalResult
  shares: SignalResult
  views: SignalResult
  rediscoveries: SignalResult
  searches: SignalResult
  communityPulse: SignalResult
  discoveryNotes: SignalResult
}

export type MomentumScore = {
  ticker: string
  creatorId: string
  score: number           // 0-100 final score
  signals: InternalSignals
  breakout: boolean       // true if acceleration detected
  generatedAt: string
}

// Phase 2 stub — external providers will implement this
export interface ExternalSignalProvider {
  name: string
  fetchSignals(creatorId: string): Promise<Record<string, number>>
}
