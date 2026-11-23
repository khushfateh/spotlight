// Single source of truth for the Home exhibition scene.
// Updated by: HomeScene (scroll/cursor/reveal), SaxophoneVitrine (introT), OrbitalSystem.
// Read by: SaxophoneVitrine, GoldDustEcosystem, EnvironmentLayer, OrbitalSystem, LeftStorytelling, GlassNav.

export const homeState = {
  // Scroll
  scrollY:           0,
  scrollProgress:    0,       // 0–1 over the full scroll container

  // Orbit — Ferris-wheel rotation in radians
  orbitAngle:        0,
  orbitAngleTarget:  0,

  // Saxophone world X offset (0 = viewport center, ~1.2 = right of center)
  saxOffsetX:        0,

  // Storytelling section index 0–4
  storySection:      0,

  // Seconds elapsed since scene mount
  introT:            0,

  // Normalized cursor position –1…1
  pointerX:          0,
  pointerY:          0,

  // Accumulated drag-rotation
  dragRotY:          0,
  dragRotX:          0,

  // Index of the currently hovered card (–1 = none)
  hoveredCard:       -1,

  // ── Cinematic reveal state machine ───────────────────────────────────────
  // Phase 0: universe exists, saxophone completely invisible
  // Phase 1: silhouette — dark matte shape with champagne-gold rim light
  // Phase 2: material reveal — light discovers the brass surface over 1.8 s
  // Phase 3: complete — idle breathing, full interactivity
  revealPhase:       0 as 0 | 1 | 2 | 3,
  revealProgress:    0,       // 0→1 during phase 2
  revealStartT:      0,       // introT when phase 2 began
  silhouetteStartT:  0,       // introT when phase 1 began
  revealCompleteT:   0,       // introT when phase 3 began
}

// Live saxophone position — written each frame by SaxophoneVitrine,
// read by GoldDustEcosystem to compute velocity kicks.
export const saxLivePos = {
  x: 0, y: 0, z: 0,
  prevX: 0, prevY: 0, prevZ: 0,
}
