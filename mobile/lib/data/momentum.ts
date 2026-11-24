export type MomentumData = {
  score: number  // 0–100
  delta: number  // weekly point change
}

export const MOMENTUM: Record<string, MomentumData> = {
  APDHILLON:   { score: 94, delta: 12 },
  KARANAUJLA:  { score: 91, delta:  9 },
  HANUMANKIND: { score: 88, delta: 15 },
  SABRINAC:    { score: 87, delta:  7 },
  DOJACAT:     { score: 85, delta:  4 },
  TYLERTC:     { score: 83, delta:  6 },
  ICESPICE:    { score: 80, delta: 11 },
  PESOPLUMA:   { score: 79, delta:  8 },
  NEWJEANS:    { score: 76, delta: 10 },
  SHUBH:       { score: 72, delta:  9 },
  LILNASX:     { score: 70, delta:  3 },
  CORPSE:      { score: 62, delta:  5 },
}

export function getMomentum(ticker: string): MomentumData {
  return MOMENTUM[ticker.toUpperCase()] ?? { score: 50, delta: 0 }
}

export function getMomentumTier(score: number): string {
  if (score >= 90) return 'Icon'
  if (score >= 76) return 'Viral'
  if (score >= 61) return 'Breakout'
  if (score >= 41) return 'Heating Up'
  if (score >= 21) return 'Rising'
  return 'Emerging'
}
