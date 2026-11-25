/**
 * Single source of truth for the Discover "Observatory" 3D scene.
 * Kept separate from the Home scene's sceneState so the two screens can
 * never disturb each other.
 *
 * Written by: Discover screen (scroll, tilt, drag, search pulse),
 *             DiscoverScene3D (introT, reveal machine), PianoModel (livePos).
 * Read by:    every Observatory layer.
 */

export const discoverState = {
  // Seconds since the Canvas mounted
  introT: 0,

  // Device tilt, normalised –1…1
  pointerX: 0,
  pointerY: 0,

  // Swipe rotation (+ release inertia in rad/s)
  dragRotY: 0,
  dragRotX: 0,
  dragVelY: 0,
  dragging: false,

  // ── Page geometry (points) ────────────────────────────────────────────────
  scrollY: 0,
  /** content offset where the piano stage page begins */
  stageTop: 100000,
  /** height of one page (= the scroll view's height) */
  pageH: 800,
  /** canvas size in points */
  viewW: 390,
  viewH: 844,
  /** false while searching / filtering — the piano bows out */
  stageEnabled: true,

  /** bumped on every keystroke in search → threads shimmer */
  searchPulse: 0,

  // ── Piano reveal (same phases as the Home saxophone) ──────────────────────
  modelReady: false,
  /** the stage has scrolled into view at least once */
  revealRequested: false,
  // 0: nothing · 1: silhouette + rim · 2: light discovers the gold · 3: alive
  revealPhase: 0 as 0 | 1 | 2 | 3,
  revealProgress: 0,
  revealStartT: 0,
  silhouetteStartT: 0,
  revealCompleteT: 0,
}

/** Live piano pose, published every frame for the dust that comes off it */
export const pianoLivePos = {
  x: 0, y: 0, z: 0,
  /** 0 hidden → 1 fully present (drives emission opacity) */
  presence: 0,
  /** 0 centre stage → 1 receded behind the editorial sheet (dims the lights) */
  recede: 0,
}

// ── Keep-alive: Discover Mode (a modal on top) keeps the scene rendering ────
type Listener = (alive: boolean) => void
const listeners = new Set<Listener>()
let keepAlive = false

export function setSceneKeepAlive(v: boolean) {
  keepAlive = v
  listeners.forEach((l) => l(v))
}
export function getSceneKeepAlive() {
  return keepAlive
}
export function onSceneKeepAlive(l: Listener) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
