'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { homeState, saxLivePos } from './homeState'

// Hero pose: three-quarter view showing bell and engraved details
const HERO_ROT_Y =  Math.PI * 0.30
const HERO_ROT_X = -Math.PI * 0.055

// Pre-allocated colors (never allocated per-frame)
const SIL_COLOR     = new THREE.Color('#060503')
const RIM_EMISSIVE  = new THREE.Color('#B8943C')
const WARM_EMISSIVE = new THREE.Color('#3d2200')

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface MatEntry {
  mat:       THREE.MeshStandardMaterial
  origColor: THREE.Color
  origRoughness:       number
  origMetalness:       number
  origEnvMapIntensity: number
}

export default function SaxophoneVitrine() {
  const { scene }    = useGLTF('/models/saxophone.glb')
  const groupRef     = useRef<THREE.Group>(null)
  const matDataRef   = useRef<MatEntry[]>([])
  const prevPhaseRef = useRef<number>(-1)
  const silInitRef   = useRef(false)   // have we written the silhouette state yet?

  const model = useMemo(() => {
    const clone = scene.clone(true)

    // Auto-fit to 5.3 world-unit height
    const box  = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    clone.scale.setScalar(5.3 / (Math.max(size.x, size.y, size.z) || 1))
    box.setFromObject(clone)
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.sub(center)

    // Clone every material so the useGLTF cache stays completely untouched.
    // We record the original GLTF values here but do NOT override anything —
    // that happens at runtime in useFrame the moment phase 1 begins.
    const srcToClone = new Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>()
    const entries: MatEntry[] = []

    clone.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const m = o.material
      if (!m || Array.isArray(m) || !('metalness' in m)) return
      const src = m as THREE.MeshStandardMaterial

      let mat = srcToClone.get(src)
      if (!mat) {
        mat = src.clone()
        srcToClone.set(src, mat)

        entries.push({
          mat,
          origColor:           mat.color.clone(),
          origRoughness:       mat.roughness,
          origMetalness:       mat.metalness,
          origEnvMapIntensity: mat.envMapIntensity,
        })
      }

      o.material = mat
    })

    matDataRef.current = entries
    silInitRef.current = false   // reset on every model load
    return clone
  }, [scene])

  useFrame((state, dt) => {
    if (!groupRef.current) return
    const t   = state.clock.getElapsedTime()
    homeState.introT = t

    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const ease  = easeInOut(rp)

    const p  = homeState.scrollProgress
    const px = homeState.pointerX
    const py = homeState.pointerY

    // ── Position ───────────────────────────────────────────────────────────
    const breathe = Math.sin(t * 0.48) * 0.038
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, homeState.saxOffsetX, 0.045,
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y, breathe, 0.045,
    )

    // ── Rotation: hero pose → interactive after reveal ─────────────────────
    const phase3Progress = phase >= 3
      ? Math.min(1, (t - homeState.revealCompleteT) / 2.2)
      : 0.0

    const scrollRot = p * Math.PI * 1.5
    const userRotY  = scrollRot + homeState.dragRotY + px * 0.14
    const userRotX  = homeState.dragRotX - py * 0.10

    const targetRotY = THREE.MathUtils.lerp(HERO_ROT_Y, userRotY, phase3Progress)
    const targetRotX = THREE.MathUtils.lerp(HERO_ROT_X, userRotX, phase3Progress)

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.06)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, px * 0.03, 0.05)

    // ── Visibility & material reveal ───────────────────────────────────────

    if (phase === 0) {
      // Universe only — keep the group completely hidden (no opacity tricks)
      groupRef.current.visible = false
      prevPhaseRef.current = 0
      return
    }

    // Phase 1+: group must be visible
    groupRef.current.visible = true

    // On first entry to phase 1, stamp the silhouette starting state onto materials.
    // This is the ONLY place we write SIL_COLOR — after origColor is safely captured.
    if (phase >= 1 && !silInitRef.current) {
      silInitRef.current = true
      for (const e of matDataRef.current) {
        const { mat } = e
        mat.color.copy(SIL_COLOR)
        mat.metalness         = 0.0
        mat.roughness         = 1.0
        mat.envMapIntensity   = 0.0
        mat.emissive          = RIM_EMISSIVE.clone()
        mat.emissiveIntensity = 0.0
        mat.transparent       = true
        mat.opacity           = 0.0
        mat.depthWrite        = false
        mat.needsUpdate       = true
      }
    }

    for (const { mat, origColor, origRoughness, origMetalness, origEnvMapIntensity } of matDataRef.current) {
      if (phase === 1) {
        // Silhouette: dark matte body + champagne rim light fading in (0.5s — held for mystery)
        const silT = Math.min(1, (t - homeState.silhouetteStartT) / 0.5)
        mat.opacity           = THREE.MathUtils.lerp(mat.opacity, silT * 0.50, 0.07)
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, silT * 0.09, 0.05)
        mat.emissive.copy(RIM_EMISSIVE)
        mat.color.copy(SIL_COLOR)

      } else if (phase === 2) {
        // 1.0-second material reveal — colour arrives first, then reflections
        mat.opacity = 0.50 + 0.50 * Math.pow(rp, 0.55)

        // Colour: front-loaded — fully original by 65% through the reveal
        const colT = Math.min(1, ease / 0.65)
        mat.color.lerpColors(SIL_COLOR, origColor, colT)

        // Roughness: matte → original
        mat.roughness = THREE.MathUtils.lerp(1.0, origRoughness, ease)

        // Metalness: slightly delayed
        const metT = Math.max(0, (ease - 0.15) / 0.85)
        mat.metalness = metT * origMetalness

        // Env reflections: last to arrive
        const envT = Math.max(0, (ease - 0.25) / 0.75)
        mat.envMapIntensity = envT * origEnvMapIntensity

        // Emissive: rim → warm brass
        if (ease < 0.35) {
          mat.emissive.copy(RIM_EMISSIVE)
          mat.emissiveIntensity = THREE.MathUtils.lerp(0.09, 0.14, ease / 0.35)
        } else {
          const emitT = (ease - 0.35) / 0.65
          mat.emissive.lerpColors(RIM_EMISSIVE, WARM_EMISSIVE, emitT)
          mat.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.28, emitT)
        }

      } else {
        // Phase 3: complete — scroll fade only, hold exact GLTF material values
        const scrollFade = p < 0.88 ? 1.0 : Math.max(0, (0.96 - p) / 0.08)
        mat.opacity           = THREE.MathUtils.lerp(mat.opacity, scrollFade, 0.06)
        mat.color.lerp(origColor, 0.08)
        mat.roughness         = THREE.MathUtils.lerp(mat.roughness, origRoughness, 0.05)
        mat.metalness         = THREE.MathUtils.lerp(mat.metalness, origMetalness, 0.05)
        mat.envMapIntensity   = THREE.MathUtils.lerp(mat.envMapIntensity, origEnvMapIntensity, 0.05)
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.28, 0.04)
      }

      mat.needsUpdate = true
    }

    prevPhaseRef.current = phase

    // Publish live sax position for particle velocity
    saxLivePos.prevX = saxLivePos.x
    saxLivePos.prevY = saxLivePos.y
    saxLivePos.prevZ = saxLivePos.z
    saxLivePos.x     = groupRef.current.position.x
    saxLivePos.y     = groupRef.current.position.y
    saxLivePos.z     = groupRef.current.position.z
  })

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload('/models/saxophone.glb')
