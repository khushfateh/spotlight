/**
 * Pure framing math for the Discover piano stage (no React / RN imports, so it
 * can be unit-tested in node and reused by the browser render harness).
 *
 * The piano lives in the fixed 3D background but behaves as if it sits on the
 * stage page: it rides up with the content, settles centred when the stage
 * snaps into place, then recedes (slower parallax, pushed back, dimmed) as the
 * editorial sheet slides over it.
 */

// Camera — same lens + distance as the web Observatory, so the background
// particle systems keep their exact web composition.
export const FOV = 46
export const CAM_Z = 7
export const TAN_HALF_FOV = Math.tan((FOV / 2) * Math.PI / 180)

/** Piano centre as a fraction of the page height when the stage is settled */
export const STAGE_CENTER = 0.45
/** After the stage, the piano moves at this fraction of the scroll speed */
const PARALLAX = 0.42
/** How far (world units) the piano is pushed back as it recedes */
export const RECEDE_DEPTH = 3.2
/** The reveal begins once the stage is this far (in pages) from settled */
export const REVEAL_TRIGGER = -0.6

// Hero pose: three-quarter view from the keyboard side, looking slightly down
// onto the open lid (keys face +Z in the model).
export const HERO_ROT_Y = 0.55
export const HERO_ROT_X = 0.2

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** World-space size of the camera's view at a given distance */
export function visibleAt(dist: number, aspect: number) {
  const h = 2 * dist * TAN_HALF_FOV
  return { w: h * aspect, h }
}

/**
 * Largest dimension (world units) the piano model is normalised to, so it
 * fills ~95% of the screen width at its widest (any rotation) without crowding the height.
 * The normalised model spans ≤1.2 × size across and ≤0.9 × size tall.
 */
export function pianoSize(viewW: number, viewH: number) {
  const v = visibleAt(CAM_Z, viewW / Math.max(1, viewH))
  return Math.min((0.95 * v.w) / 1.2, (0.36 * v.h) / 0.9)
}

export interface StageFrame {
  /** piano centre, in points from the top of the screen */
  screenY: number
  /** 0 settled → 1 fully receded behind the editorial sheet */
  recede: number
  /** stage offset in pages: <0 below, 0 settled, >0 scrolled past */
  pages: number
}

export function stageFrame(scrollY: number, stageTop: number, pageH: number, enabled: boolean): StageFrame {
  const s = scrollY - stageTop
  const pages = s / Math.max(1, pageH)
  if (!enabled) return { screenY: pageH * 1.6, recede: 0, pages }
  const screenY = s <= 0
    ? pageH * STAGE_CENTER - s            // rides up with the page
    : pageH * STAGE_CENTER - s * PARALLAX // lingers, then slips away
  const recede = clamp(s / (pageH * 0.9), 0, 1)
  return { screenY, recede, pages }
}

/** World Y that places an object at depth `dist` from the camera at screenY */
export function worldYForScreen(screenY: number, viewH: number, dist: number) {
  return -(screenY / Math.max(1, viewH) - 0.5) * 2 * dist * TAN_HALF_FOV
}

/** smoothstep */
export function smooth(t: number) {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
