// SPOTLIGHT Motion System
// One unified language for every interaction on the platform.
// Luxurious, intentional, smooth. Never flashy.

export const ease = [0.16, 1, 0.3, 1] as const

export const spring = { type: 'spring' as const, stiffness: 220, damping: 28 }
export const springSnappy = { type: 'spring' as const, stiffness: 380, damping: 32 }
export const springBouncy = { type: 'spring' as const, stiffness: 260, damping: 20 }

// Page-level entrance — subtle lift from below
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease, delay },
  }
}

// Section/card entrance — tighter than page-level
export function scaleIn(delay = 0) {
  return {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease, delay },
  }
}

// Scroll-reveal variant (whileInView)
export function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1 as number, y: 0 as number },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.65, ease, delay },
  }
}

// Standard section reveal used across pages
export const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1 as number, y: 0 as number },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, ease },
}

// List item stagger — for rows/cards
export function listReveal(i: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease, delay: i * 0.07 },
  }
}

// Subtle horizontal slide — for filter pills, tabs
export function slideIn(delay = 0) {
  return {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease, delay },
  }
}

// Count-up animation timing (used with RAF in components)
export const countDuration = 1400 // ms
export const countEase = (t: number) => 1 - Math.pow(1 - t, 3)
