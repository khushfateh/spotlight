// Mock momentum scores — in production these are computed in the backend
// from streaming velocity, social engagement, search trends, collab graph,
// press coverage, and fan sentiment signals.

export type MomentumData = {
  score: number   // 0–100
  delta: number   // weekly point change (positive = rising)
}

export const MOMENTUM: Record<string, MomentumData> = {
  // Active creators
  APDHILLON:  { score: 82, delta: 7  },
  MRBEAST:    { score: 96, delta: 2  },
  SPEED:      { score: 89, delta: 11 },
  LILNASX:    { score: 74, delta: 4  },
  CHARLID:    { score: 67, delta: -3 },
  KSI:        { score: 77, delta: 5  },
  EMMA:       { score: 61, delta: 2  },
  KAICENAT:   { score: 93, delta: 8  },
  ADDISON:    { score: 48, delta: -4 },
  ZACHK:      { score: 55, delta: 1  },
  POKI:       { score: 71, delta: -2 },
  NIKKIE:     { score: 46, delta: 3  },
  // Debut creators (IPO)
  DURK:       { score: 73, delta: 5  },
  CLIX:       { score: 61, delta: 8  },
  NEWJEANS:   { score: 85, delta: 11 },
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
