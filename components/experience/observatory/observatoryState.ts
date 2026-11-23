// Shared mutable state for the Observatory scene.
// Written by: explore/page.tsx (scroll, cursor, search)
// Read by: ObservatoryScene, PianoAtmosphere
export const obsState = {
  pointerX:       0,
  pointerY:       0,
  scrollProgress: 0,
  searchQuery:    '',
  searchActive:   false,
  searchPulse:    0,     // incremented each time user types, drives key flash
  introT:         0,     // seconds since scene mount
}

// Piano live position (updated each frame by the scene)
export const pianoLivePos = { x: 0, y: 0, z: 0 }
