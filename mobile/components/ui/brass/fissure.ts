/**
 * "The Fissure" — the brass button's navigate effect.
 *
 * One elegant VERTICAL crack splits the plate down its centre: it starts on
 * the centre line at the height of the tap and races up and down to the
 * edges (beneath the label, which stays intact), with hairline side branches. Light leaks from it; minute stardust lifts off along it; fine
 * golden threads unfurl from it. Quick (≈0.7 s) and the label stays intact.
 *
 * Geometry is pure TS (node-testable); timeline helpers are worklets so they
 * run on the UI thread.
 */

export type Pt = { x: number; y: number }

export interface Dust { x: number; y: number; vx: number; vy: number; at: number; life: number; r: number; tw: number }
export interface Thread { svg: string; at: number; dx: number; dy: number }
export interface Fissure {
  /** crack arms, each starting at the impact (so trimming 0→1 grows outward) */
  arms: Pt[][]
  /** hairline branches + when (0..1 of the spread) they appear */
  branches: { pts: Pt[]; at: number }[]
  dust: Dust[]
  threads: Thread[]
  tap: Pt
}

// ── Timeline (t: 0 → 1 over FISSURE_MS) ─────────────────────────────────────
export const FISSURE_MS = 700
/** onPress (navigation) fires here — at the light's crescendo */
export const FISSURE_NAVIGATE_AT = 0.78
/** haptic "tick" as the light crescendos */
export const FISSURE_CRESCENDO_AT = 0.56

const SPREAD_START = 0.05
const SPREAD_LEN = 0.36

function clamp01(x: number) {
  'worklet'
  return Math.max(0, Math.min(1, x))
}

/** 0 → 1: how far along its length the crack has run (fast start, eases out) */
export function fissureSpread(t: number) {
  'worklet'
  const c = clamp01((t - SPREAD_START) / SPREAD_LEN)
  return 1 - Math.pow(1 - c, 3)
}

/** time (0..1) at which the crack reaches fraction s of its length */
function reachTime(s: number) {
  return SPREAD_START + SPREAD_LEN * (1 - Math.cbrt(1 - Math.min(0.999, s)))
}

/** light leaking from the crack: builds with the spread, crescendos, then eases */
export function fissureGlow(t: number) {
  'worklet'
  const build = clamp01((t - 0.04) / 0.30)
  const swell = Math.exp(-Math.pow((t - 0.6) / 0.12, 2))
  return build * (0.75 + 0.9 * swell)
}

/** whole-plate flare at the crescendo (feeds the brass shader's uFlare) */
export function fissureFlare(t: number) {
  'worklet'
  return 0.28 * Math.exp(-Math.pow((t - 0.62) / 0.10, 2))
}

/** pinpoint flash at the impact */
export function impactFlash(t: number) {
  'worklet'
  return t <= 0 ? 0 : Math.exp(-t / 0.07) * clamp01(t / 0.012)
}

/** tiny dip of the plate on impact */
export function fissureDip(t: number) {
  'worklet'
  const k = clamp01(t / 0.14)
  return 1 - 0.022 * Math.sin(k * Math.PI)
}

// ── Seeded RNG ───────────────────────────────────────────────────────────────
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f2 = (n: number) => n.toFixed(2)
export function polylineSvg(pts: Pt[]) {
  return 'M' + pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(' L')
}

/** point at arc-length fraction s along a polyline */
function along(pts: Pt[], s: number): { p: Pt; dir: Pt } {
  let total = 0
  const seg: number[] = []
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); total += d }
  let want = s * total
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, want / seg[i]) : 0
      const a = pts[i], b = pts[i + 1]
      const dl = seg[i] || 1
      return { p: { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, dir: { x: (b.x - a.x) / dl, y: (b.y - a.y) / dl } }
    }
    want -= seg[i]
  }
  return { p: pts[pts.length - 1], dir: { x: 1, y: 0 } }
}

/** one jagged vertical arm from `from` to y = toY, held near the centre line */
function arm(from: Pt, toY: number, w: number, r: () => number): Pt[] {
  const pts: Pt[] = [from]
  const dir = Math.sign(toY - from.y) || 1
  const mid = w / 2, band = Math.min(9, w * 0.04)
  let x = from.x, y = from.y
  while ((toY - y) * dir > 0.3) {
    const step = 2.6 + r() * 3.4
    y += dir * step
    if ((toY - y) * dir < 0) y = toY
    // side-to-side wander pulled back to the centre line; occasional sharp kink
    const kink = r() < 0.22 ? (r() - 0.5) * 7 : 0
    x += (r() - 0.5) * 4 + (mid - x) * 0.3 + kink
    x = Math.max(mid - band, Math.min(mid + band, x))
    pts.push({ x, y })
  }
  // always finish exactly on the edge — the crack truly splits the plate
  if (pts[pts.length - 1].y !== toY) pts.push({ x, y: toY })
  return pts
}

export function makeFissure(w: number, h: number, tapIn: Pt, seed: number): Fissure {
  const r = rng(seed)
  // Origin: on the centre line, at the height of the tap
  const tap = {
    x: w / 2 + (r() - 0.5) * Math.min(6, w * 0.03),
    y: Math.max(h * 0.25, Math.min(h * 0.75, tapIn.y)),
  }
  // Split up to the top edge and down to the bottom edge
  const arms: Pt[][] = [arm(tap, 0, w, r), arm(tap, h, w, r)]

  // Hairline branches
  const branches: { pts: Pt[]; at: number }[] = []
  for (const a of arms) {
    const n = 1 + Math.floor(r() * 1.6)
    for (let i = 0; i < n; i++) {
      const s = 0.25 + r() * 0.6
      const { p, dir } = along(a, s)
      // Fork sideways off the vertical crack
      const base = Math.atan2(dir.y, dir.x)
      const side = r() < 0.5 ? -1 : 1
      const ang = base + side * (0.7 + r() * 0.5)
      const len = 5 + r() * 7
      const mid = { x: p.x + Math.cos(ang) * len * 0.55 + (r() - 0.5) * 2, y: p.y + Math.sin(ang) * len * 0.55 }
      const end = { x: p.x + Math.cos(ang + side * 0.25) * len, y: p.y + Math.sin(ang + side * 0.25) * len }
      branches.push({ pts: [p, mid, end], at: reachTime(s) })
    }
  }

  // Minute stardust lifting off along the crack as it passes (+ a crescendo burst)
  const dust: Dust[] = []
  const N = 60
  for (let i = 0; i < N; i++) {
    const a = arms[i % arms.length]
    const s = r()
    const { p, dir } = along(a, s)
    const burst = i >= N - 18
    const side = r() < 0.5 ? -1 : 1                        // left or right of the crack
    const nx = -dir.y * side, ny = dir.x * side
    const sp = (burst ? 28 : 16) + r() * (burst ? 46 : 26)  // points per unit t
    dust.push({
      x: p.x, y: p.y,
      vx: nx * sp + (r() - 0.5) * 10,
      vy: ny * sp - 8 - r() * 14,
      at: burst ? 0.5 + r() * 0.08 : reachTime(s) + r() * 0.04,
      life: 0.28 + r() * 0.3,
      r: 0.45 + r() * 0.65,
      tw: r() * 6.28,
    })
  }

  // Fine golden threads unfurling from the fissure
  const threads: Thread[] = []
  const T = 6
  for (let i = 0; i < T; i++) {
    // Released where the crack meets the plate's edges, travelling outward —
    // away from the label, which stays untouched. Two of three rise.
    const upper = i % 3 !== 2
    const a = upper ? arms[0] : arms[arms.length - 1]
    const s = 0.72 + r() * 0.26
    const { p } = along(a, s)
    const up = upper ? -1 : 1
    const len = 14 + r() * 16
    const curl = (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6)
    // S-curve: out, swirl back, and away
    const m = { x: p.x + curl * len * 0.32, y: p.y + up * len * 0.5 }
    const c1 = { x: p.x + curl * len * 0.55, y: p.y + up * len * 0.12 }
    const c2 = { x: m.x + curl * len * 0.35, y: m.y - up * len * 0.05 }
    const c3 = { x: m.x - curl * len * 0.55, y: m.y + up * len * 0.35 }
    const e = { x: m.x - curl * len * 0.2, y: p.y + up * len }
    const c4 = { x: e.x + curl * len * 0.25, y: e.y - up * len * 0.15 }
    threads.push({
      svg: `M${f2(p.x)} ${f2(p.y)} C${f2(c1.x)} ${f2(c1.y)} ${f2(c2.x)} ${f2(c2.y)} ${f2(m.x)} ${f2(m.y)} C${f2(c3.x)} ${f2(c3.y)} ${f2(c4.x)} ${f2(c4.y)} ${f2(e.x)} ${f2(e.y)}`,
      at: reachTime(s) + 0.02,
      dx: curl * 4, dy: up * 6 - 6,
    })
  }

  return { arms, branches, dust, threads, tap }
}

/** Dust particle state at time t → [x, y, alpha, radius] (worklet) */
export function dustAt(d: Dust, t: number): [number, number, number, number] {
  'worklet'
  const u = (t - d.at) / d.life
  if (u <= 0 || u >= 1) return [0, 0, 0, 0]
  const e = 1 - Math.pow(1 - u, 2)
  const x = d.x + d.vx * d.life * e
  const y = d.y + d.vy * d.life * e
  const a = Math.min(1, u / 0.12) * (1 - u) * (0.65 + 0.35 * Math.sin(d.tw + t * 40))
  return [x, y, a, d.r * (1 - 0.3 * u)]
}

/** Thread state at time t → [trimEnd, opacity, offsetX, offsetY] (worklet) */
export function threadAt(at: number, dx: number, dy: number, t: number): [number, number, number, number] {
  'worklet'
  const u = clamp01((t - at) / 0.42)
  if (u <= 0) return [0, 0, 0, 0]
  const grow = 1 - Math.pow(1 - clamp01(u / 0.55), 3)
  const fade = 1 - clamp01((u - 0.55) / 0.45)
  return [grow, fade, dx * u, dy * u]
}
