// Shared singletons — written by DOM/GSAP, read by Three.js useFrame. No React re-renders.

// GSAP scroll progress drives axial spin
export const scrollState = { rotation: 0 }

// Pointer-drag accumulates on top of scroll rotation
export const dragState = {
  isDragging: false,
  rotY: 0,   // accumulated horizontal drag (radians)
  rotX: 0,   // accumulated vertical drag (radians)
  lastX: 0,
  lastY: 0,
}

// Written by useFrame every tick so onPointerDown can capture the live visual
// position before suppressing idle-drift and cursor-lean terms.
export const visualState = { rotY: 0, rotX: 0 }
