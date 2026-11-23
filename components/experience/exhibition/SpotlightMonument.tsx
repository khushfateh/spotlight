'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { homeState } from './homeState'

// Cinzel Regular — Roman lapidary inscription letterforms. All-caps natural,
// extraordinary thick/thin stroke contrast: verticals absorb, thin serifs and
// horizontals catch raking gold shimmer just like stone carving catches light.
// WOFF format (opentype.js-compatible; troika does not support WOFF2).
const FONT_URL = '/fonts/cinzel-regular.woff'

// fontSize=2.8 at camera z≈7, monument z=-4.2 → distance ≈11.2 world units.
// 75° vertical FOV, 16:9 aspect → horizontal viewport ≈30 world units.
// "SPOTLIGHT" in Cinzel at this size + letterSpacing=0.12 spans ~17 world units:
// fully readable on desktop; partially revealed on mobile (intentional depth).
const FONT_SIZE      = 2.8
const LETTER_SPACING = 0.12

const Z_BASE = -4.2

// The typography NEVER emits light. It only reads through:
//   • saxophone reflections (outline color matches brass exactly)
//   • gold shimmer particles (additive blend creates impression of illumination)
//   • HDR/volumetric glow pooling in the carved edges
//
// Fill is void-dark (#050508 = scene background) — the letterform body reads as
// an absence of light, like shadow carved into the atmosphere.
// Outline (#C9A84C = exact saxophone brass) at 55% ceiling: reads as the
// environment's gold landing on the carved edge, not the text itself glowing.
const BODY_OPACITY_MAX    = 0.05
const OUTLINE_OPACITY_MAX = 0.55

export default function SpotlightMonument() {
  const groupRef   = useRef<THREE.Group>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyRef    = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outlineRef = useRef<any>(null)

  // Smooth recession state — lerped toward scroll-driven targets each frame
  const lerpedZ      = useRef(Z_BASE)
  const lerpedScale  = useRef(1.0)
  const lerpedOpMult = useRef(1.0)

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const t     = homeState.introT
    const sp    = homeState.scrollProgress
    const phase = homeState.revealPhase

    // ── Phase reveal gate ─────────────────────────────────────────────────────
    // Monument crystallises partway through Phase 2 (after saxophone begins
    // to emerge). Never upstages the saxophone reveal sequence.
    const phaseTarget =
      phase <= 1 ? 0 :
      phase === 2 ? Math.max(0, (homeState.revealProgress - 0.25) / 0.75) :
      1

    // ── Scroll-driven recession ───────────────────────────────────────────────
    // As the user scrolls deeper, the monument "elopes into the universe":
    //   • z drifts further back (deeper into void)
    //   • scale shrinks toward nothing
    //   • opacity fades out
    // Reversible: scrolling back up restores it with elastic exponential-lerp.
    // Full recession by sp=0.35 (monument gone by mid-scroll depth).
    const r = Math.min(1, sp / 0.35)   // 0 → 1 over first 35% of scroll
    const zTarget     = Z_BASE - r * 16   // recedes up to 16 units deeper
    const scaleTarget = Math.max(0.01, 1.0 - r * 0.92)   // 1.0 → 0.08
    const opTarget    = 1.0 - r                           // 1.0 → 0.0

    const k = 1 - Math.exp(-3.5 * dt)
    lerpedZ.current      += (zTarget     - lerpedZ.current)      * k
    lerpedScale.current  += (scaleTarget - lerpedScale.current)  * k
    lerpedOpMult.current += (opTarget    - lerpedOpMult.current) * k

    groupRef.current.position.z = lerpedZ.current
    groupRef.current.scale.setScalar(lerpedScale.current)

    // ── Atmospheric breathing ─────────────────────────────────────────────────
    const breatheX = Math.sin(t * 0.17) * 0.004 + Math.sin(t * 0.31) * 0.002
    const breatheY = Math.sin(t * 0.11) * 0.003 + Math.sin(t * 0.23) * 0.001
    const parallaxX = homeState.pointerX * -0.04
    const parallaxY = homeState.pointerY *  0.02

    groupRef.current.position.x = parallaxX + breatheX
    groupRef.current.position.y = parallaxY + breatheY

    // ── Borrowed-light opacity ────────────────────────────────────────────────
    const combined = phaseTarget * Math.max(0, lerpedOpMult.current)

    if (bodyRef.current) {
      const tgt = combined * BODY_OPACITY_MAX
      bodyRef.current.fillOpacity +=
        (tgt - bodyRef.current.fillOpacity) * (1 - Math.exp(-2.0 * dt))
    }

    if (outlineRef.current) {
      const tgt = combined * OUTLINE_OPACITY_MAX
      outlineRef.current.outlineOpacity +=
        (tgt - outlineRef.current.outlineOpacity) * (1 - Math.exp(-1.8 * dt))
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, Z_BASE]}>
      {/* Layer A — void-dark body.
          Color matches the scene background exactly — the letterform body
          reads as a shadow carved into the atmosphere, not as an object.
          Gold particles (additive blend) landing on this surface create the
          impression of light pooling in carved recesses. */}
      <Text
        ref={bodyRef}
        font={FONT_URL}
        fontSize={FONT_SIZE}
        letterSpacing={LETTER_SPACING}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0}
        color="#050508"
        renderOrder={-1}
        depthOffset={2}
      >
        SPOTLIGHT
      </Text>

      {/* Layer B — brass-gold outline.
          #C9A84C exactly matches saxophone metal and the particle field.
          The outline reads as saxophone/environment light landing on carved
          stone edges — not the text emitting. Cinzel's thin serifs and
          hairline horizontals vs bold verticals create varied light-catch
          across each letterform, reinforcing the engraved-stone illusion.
          outlineWidth 0.008em ≈ 3-4 screen pixels at this distance. */}
      <Text
        ref={outlineRef}
        font={FONT_URL}
        fontSize={FONT_SIZE}
        letterSpacing={LETTER_SPACING}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineColor="#C9A84C"
        outlineOpacity={0}
        outlineWidth={0.008}
        color="#000000"
        renderOrder={-1}
        depthOffset={1}
      >
        SPOTLIGHT
      </Text>
    </group>
  )
}
