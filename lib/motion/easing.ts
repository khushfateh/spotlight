// Shared motion language for the SPOTLIGHT experience layer.
// All animations reference these constants — no scattered magic numbers.

export const premiumEase = [0.16, 1, 0.3, 1] as const

export const softSpring = {
  type: 'spring' as const,
  stiffness: 55,
  damping: 20,
}

export const cinematicReveal = {
  duration: 0.75,
  ease: premiumEase,
}

// Used for magnetic card hover pull
export const magneticHover = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 24,
}

// Used for vault / deep-reveal animations
export const vaultReveal = {
  type: 'spring' as const,
  stiffness: 45,
  damping: 14,
}

// Used for depth/parallax scroll layers
export const depthDrift = {
  stiffness: 38,
  damping: 18,
}

// stagger factory: i → delay in seconds
export const stagger = (i: number, base = 0.07) => ({ delay: i * base })
