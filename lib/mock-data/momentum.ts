// Mock momentum scores — in production computed from streaming velocity,
// social engagement, search trends, collab graph, press coverage, fan sentiment.

export type MomentumData = {
  score: number   // 0–100
  delta: number   // weekly point change (positive = rising)
}

export const MOMENTUM: Record<string, MomentumData> = {
  // Original creators — keys aligned to creator tickers
  APDHILLON:   { score: 82, delta: 7  },
  LILNASX:     { score: 74, delta: 4  },
  CORPSE:      { score: 58, delta: 6  },

  // New creators
  SHUBH:       { score: 78, delta: 9  },
  KARANAUJLA:  { score: 72, delta: 6  },
  HANUMANKIND: { score: 69, delta: 14 },
  DOJACAT:     { score: 88, delta: 3  },
  ICESPICE:    { score: 76, delta: 8  },
  SABRINA:     { score: 91, delta: 5  },
  TYLERTC:     { score: 83, delta: 2  },
  PESOPLUMA:   { score: 87, delta: 12 },
  NEWJEANS:    { score: 85, delta: 11 },
}

export function getMomentum(ticker: string): MomentumData {
  return MOMENTUM[ticker.toUpperCase()] ?? { score: 50, delta: 0 }
}

export function getMomentumTier(score: number): string {
  if (score >= 91) return 'Icon'
  if (score >= 76) return 'Viral'
  if (score >= 61) return 'Breakout'
  if (score >= 41) return 'Heating Up'
  if (score >= 21) return 'Rising'
  return 'Emerging'
}
