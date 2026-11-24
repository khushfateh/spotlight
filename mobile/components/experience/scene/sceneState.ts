// Single source of truth for the mobile home 3D scene.
// Mirrors web's components/experience/exhibition/homeState.ts so the ported
// shaders/timelines behave identically.
//
// Written by: HomeScene (introT, reveal machine), SaxModel (saxLivePos),
//             home screen (scroll, tilt → pointer, swipe → dragRot).
// Read by:    every scene layer.
import { PixelRatio } from 'react-native'

export const sceneState = {
  // 0–1 over the hero height
  scrollProgress: 0,

  // Seconds since the Canvas mounted (dust starts immediately)
  introT: 0,

  // Device tilt, normalised –1…1 (plays the role of the web cursor)
  pointerX: 0,
  pointerY: 0,

  // Accumulated swipe rotation
  dragRotY: 0,
  dragRotX: 0,

  // Model finished loading?
  modelReady: false,

  // ── Cinematic reveal state machine (same phases as web) ────────────────────
  // 0: universe only · 1: silhouette + rim · 2: material reveal · 3: alive
  revealPhase: 0 as 0 | 1 | 2 | 3,
  revealProgress: 0,
  revealStartT: 0,
  silhouetteStartT: 0,
  revealCompleteT: 0,
}

export const saxLivePos = {
  x: 0, y: 0, z: 0,
  prevX: 0, prevY: 0, prevZ: 0,
}

// Phones render at native DPR (3×) while web caps at 1.8×. gl_PointSize is in
// device pixels, so scale every point so dust has the same physical size.
export const PX_SCALE = (PixelRatio.get() / 1.8).toFixed(3)

// Phone portrait sees ~half the horizontal world of a desktop browser, so we
// halve particle counts AND horizontal spread → identical on-screen density at
// half the GPU cost.
export const MOBILE_DENSITY = 0.5
