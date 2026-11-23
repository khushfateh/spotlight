// Module-level singletons — written by GSAP / events / useFrame,
// read every animation tick. Zero React re-renders.

export const exhibitionState = {
  progress:    0,    // 0–1, driven by GSAP ScrollTrigger
  pointerX:    0,    // global cursor NDC -1…1
  pointerY:    0,
  dragRotY:    0,    // accumulated drag rotation Y (radians)
  dragRotX:    0,    // accumulated drag rotation X
  liveRotY:    0,    // written by SaxophoneVitrine each frame
  liveRotX:    0,
  hoveredCard: -1,   // index of hovered glass card (-1 = none)
  introT:      0,    // seconds since mount (for cinematic intro sequence)
}

// Saxophone world position — written by SaxophoneVitrine, read by GoldDustCloud
export const saxLivePos = { x: 0, y: 0, z: 0, prevX: 0, prevY: 0, prevZ: 0 }

// Room boundaries (progress values)
export const ROOMS = {
  instrument: { start: 0.00, end: 0.28 },
  momentum:   { start: 0.28, end: 0.55 },
  vault:      { start: 0.55, end: 0.78 },
  pulse:      { start: 0.78, end: 1.00 },
}
