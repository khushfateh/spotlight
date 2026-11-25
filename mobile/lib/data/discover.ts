/**
 * Discover page data — pure functions (no React), so the rails, lenses and
 * filters are deterministic and testable.
 */
import { CREATORS } from './creators'
import { getMomentum, getMomentumTier } from './momentum'

export type Artist = {
  ticker: string
  name: string
  genre: string
  origin: string
  bio: string
  imageUrl: string
  spotters: number
  score: number
  delta: number
  tier: string
}

type ScoreFn = (ticker: string) => { score: number; delta: number; tier: string }

export function buildArtists(getScore: ScoreFn): Artist[] {
  return Object.entries(CREATORS)
    .map(([ticker, c]) => {
      let { score, delta, tier } = getScore(ticker)
      // The live momentum feed sometimes reports 0 for an artist it has no
      // data for yet — never show an established artist as "0 · Emerging".
      if (!(score > 0)) {
        const m = getMomentum(ticker)
        score = m.score
        delta = m.delta
        tier = getMomentumTier(m.score)
      }
      return { ticker, name: c.name, genre: c.genre, origin: c.origin, bio: c.bio, imageUrl: c.imageUrl, spotters: c.spotters, score, delta, tier }
    })
    .sort((a, b) => b.score - a.score || b.delta - a.delta)
}

// ── Momentum tiers (lib/data/momentum.ts) → "points to the next tier" ───────
const TIER_FLOORS: [number, string][] = [[90, 'Icon'], [76, 'Viral'], [61, 'Breakout'], [41, 'Heating Up'], [21, 'Rising']]

export function nextTier(score: number): { name: string; pts: number } | null {
  // floors are descending — the next tier up is the lowest floor above the score
  let next: [number, string] | null = null
  for (const t of TIER_FLOORS) if (t[0] > score) next = t
  return next ? { name: next[1], pts: next[0] - score } : null
}

// ── Genres (images: same Unsplash sources as the web genre crystals) ─────────
export type Genre = { id: string; label: string; glyph: string; imageUrl: string; tickers: string[] }

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=360&q=70`

export const GENRES: Genre[] = [
  { id: 'punjabi',  label: 'Punjabi',     glyph: '◈', imageUrl: U('photo-1514525253161-7a46d19cd819'), tickers: ['APDHILLON', 'KARANAUJLA', 'SHUBH'] },
  { id: 'hiphop',   label: 'Hip-Hop',     glyph: '◆', imageUrl: U('photo-1493225457124-a3eb161ffa5f'), tickers: ['HANUMANKIND', 'TYLERTC', 'ICESPICE', 'KARANAUJLA'] },
  { id: 'pop',      label: 'Pop',         glyph: '✦', imageUrl: U('photo-1516450360452-9312f5e86fc7'), tickers: ['SABRINAC', 'DOJACAT', 'NEWJEANS'] },
  { id: 'southasia',label: 'South Asian', glyph: '◇', imageUrl: U('photo-1576618148400-f54bed99fcfd'), tickers: ['APDHILLON', 'KARANAUJLA', 'SHUBH', 'HANUMANKIND'] },
  { id: 'kpop',     label: 'K-Pop',       glyph: '❀', imageUrl: U('photo-1601042879364-f3947d3f9c16'), tickers: ['NEWJEANS'] },
  { id: 'latin',    label: 'Latin',       glyph: '◉', imageUrl: U('photo-1485579149621-3123dd979885'), tickers: ['PESOPLUMA'] },
  { id: 'rnb',      label: 'R&B & Soul',  glyph: '♪', imageUrl: U('photo-1478737270239-2f02b77fc618'), tickers: ['DOJACAT'] },
].map((g) => ({ ...g, tickers: g.tickers.filter((t) => t in CREATORS) })).filter((g) => g.tickers.length > 0)

// ── Lenses (web Discovery Lenses) ────────────────────────────────────────────
export type LensId = 'trending' | 'rising' | 'breakout' | 'gems' | 'editors'
export type Lens = { id: LensId; label: string; glyph: string; color: string; description: string }

export const LENSES: Lens[] = [
  { id: 'trending', label: 'Trending',       glyph: '◆', color: '#fb923c', description: 'Highest momentum right now' },
  { id: 'rising',   label: 'Rising Fast',    glyph: '↗', color: '#34d399', description: 'Biggest score gains this week' },
  { id: 'breakout', label: 'Near Breakout',  glyph: '⚡', color: '#C9A84C', description: 'About to cross into the next tier' },
  { id: 'gems',     label: 'Hidden Gems',    glyph: '◇', color: '#60a5fa', description: 'Under the radar, accelerating' },
  { id: 'editors',  label: "Editor's Picks", glyph: '★', color: '#a78bfa', description: 'Curated by the SPOTLIGHT team' },
]

// ── Editor's picks: curated, with a one-line note ───────────────────────────
export const EDITOR_NOTES: Record<string, string> = {
  HANUMANKIND: 'Raw, regional and rewriting who gets to go global.',
  NEWJEANS:    'Effortless pop with a design language all its own.',
  PESOPLUMA:   'Corridos tumbados, carried all the way to stadium scale.',
  SHUBH:       'The quietest rise in Punjabi pop — and the steadiest.',
  TYLERTC:     'Every era a reinvention. Still ahead of the curve.',
}

// ── Rails ────────────────────────────────────────────────────────────────────
export function risingFast(all: Artist[], n = 6) {
  return [...all].filter((a) => a.delta > 0).sort((a, b) => b.delta - a.delta || b.score - a.score).slice(0, n)
}

export function nearBreakout(all: Artist[], n = 6) {
  const near = all
    .map((a) => ({ a, nt: nextTier(a.score) }))
    .filter(({ nt }) => nt && nt.pts <= 6)
    .sort((x, y) => x.nt!.pts - y.nt!.pts || y.a.delta - x.a.delta)
    .map(({ a }) => a)
  // Always show a full rail: top up with the closest-to-next-tier of the rest
  if (near.length >= 3) return near.slice(0, n)
  const rest = all.filter((a) => !near.includes(a) && nextTier(a.score))
    .sort((x, y) => nextTier(x.score)!.pts - nextTier(y.score)!.pts)
  return [...near, ...rest].slice(0, n)
}

export function trending(all: Artist[], n = 7) {
  return [...all].sort((a, b) => b.score - a.score).slice(0, n)
}

export function hiddenGems(all: Artist[], n = 5) {
  // Accelerating (delta) relative to how few people have spotted them yet
  // — and never an established Icon or a crowd favourite
  return [...all]
    .filter((a) => a.delta > 0 && a.score < 90 && a.spotters < 3500)
    .sort((a, b) => b.delta / Math.max(1, b.spotters) - a.delta / Math.max(1, a.spotters))
    .slice(0, n)
}

export function editorsPicks(all: Artist[]) {
  const by = new Map(all.map((a) => [a.ticker, a]))
  return Object.keys(EDITOR_NOTES).map((t) => by.get(t)).filter((a): a is Artist => !!a)
}

// ── Results mode: search / genre / lens ─────────────────────────────────────
export function filterArtists(all: Artist[], query: string, genreId: string | null, lens: LensId | null): Artist[] {
  let out = all
  const q = query.trim().toLowerCase()
  if (q) {
    out = out.filter((a) =>
      a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q) ||
      a.genre.toLowerCase().includes(q) || a.origin.toLowerCase().includes(q))
  }
  if (genreId) {
    const g = GENRES.find((x) => x.id === genreId)
    out = g ? out.filter((a) => g.tickers.includes(a.ticker)) : out
  }
  if (lens) {
    const allowed = new Set(
      (lens === 'trending' ? trending(all, 99)
        : lens === 'rising' ? risingFast(all, 99)
        : lens === 'breakout' ? nearBreakout(all, 99)
        : lens === 'gems' ? hiddenGems(all, 99)
        : editorsPicks(all)).map((a) => a.ticker))
    const order = lens === 'rising' ? risingFast(all, 99) : lens === 'gems' ? hiddenGems(all, 99) : lens === 'breakout' ? nearBreakout(all, 99) : null
    out = out.filter((a) => allowed.has(a.ticker))
    if (order) {
      const rank = new Map(order.map((a, i) => [a.ticker, i]))
      out = [...out].sort((a, b) => (rank.get(a.ticker) ?? 0) - (rank.get(b.ticker) ?? 0))
    }
  }
  return out
}

/** Discover Mode deck order: biggest movers first (web DiscoverStack) */
export function discoverDeck(all: Artist[]) {
  return [...all].sort((a, b) => b.delta - a.delta || b.score - a.score)
}

/** "2,841" */
export function fmtCount(n: number) {
  return n.toLocaleString('en-US')
}
