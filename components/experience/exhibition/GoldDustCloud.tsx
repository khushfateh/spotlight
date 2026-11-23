'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { homeState as exhibitionState, saxLivePos } from './homeState'

// Two particle shells:
//   INNER — dense, close, highly reactive (snappy spring)
//   OUTER — sparse, wide, lazy drift
const INNER_N = 6400   // tight halo right around the saxophone body
const OUTER_N = 3200   // loose golden atmosphere further out
const TOTAL_N = INNER_N + OUTER_N

export default function GoldDustCloud() {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef    = useRef<THREE.PointsMaterial>(null)
  const dataRef   = useRef<{
    pos:  Float32Array
    rest: Float32Array
    vel:  Float32Array
    attr: THREE.BufferAttribute
  } | null>(null)

  useEffect(() => {
    const pos  = new Float32Array(TOTAL_N * 3)
    const rest = new Float32Array(TOTAL_N * 3)
    const vel  = new Float32Array(TOTAL_N * 3)

    // ── Inner shell: r = 0.6 – 2.4, flattened (biased toward sax silhouette) ──
    for (let i = 0; i < INNER_N; i++) {
      const r     = 0.6 + Math.pow(Math.random(), 0.7) * 1.8   // biased close-in
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const x =  r * Math.sin(phi) * Math.cos(theta)
      const y =  r * Math.sin(phi) * Math.sin(theta) * 0.55    // flatten vertically
      const z =  r * Math.cos(phi) * 0.70
      rest[i*3] = x; rest[i*3+1] = y; rest[i*3+2] = z
      pos[i*3]   = x + (Math.random() - 0.5) * 0.3
      pos[i*3+1] = y + (Math.random() - 0.5) * 0.3
      pos[i*3+2] = z + (Math.random() - 0.5) * 0.3
    }

    // ── Outer shell: r = 2.0 – 5.0, more spherical ───────────────────────
    for (let i = INNER_N; i < TOTAL_N; i++) {
      const r     = 2.0 + Math.pow(Math.random(), 0.5) * 3.0
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const x =  r * Math.sin(phi) * Math.cos(theta)
      const y =  r * Math.sin(phi) * Math.sin(theta) * 0.65
      const z =  r * Math.cos(phi) * 0.78
      rest[i*3] = x; rest[i*3+1] = y; rest[i*3+2] = z
      pos[i*3]   = x + (Math.random() - 0.5) * 0.8
      pos[i*3+1] = y + (Math.random() - 0.5) * 0.8
      pos[i*3+2] = z + (Math.random() - 0.5) * 0.8
    }

    const attr = new THREE.BufferAttribute(pos, 3)
    if (pointsRef.current) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', attr)
      const old = pointsRef.current.geometry
      pointsRef.current.geometry = geo
      old.dispose()
    }
    dataRef.current = { pos, rest, vel, attr }

    return () => {
      dataRef.current = null
      pointsRef.current?.geometry.dispose()
    }
  }, [])

  useFrame(() => {
    const data = dataRef.current
    if (!data) return
    const { pos, rest, vel, attr } = data

    const sx = saxLivePos.x
    const sy = saxLivePos.y
    const sz = saxLivePos.z
    // Velocity kick from sax movement — higher multiplier = bigger splatter
    const vkx = (sx - saxLivePos.prevX) * 18
    const vky = (sy - saxLivePos.prevY) * 18
    const vkz = (sz - saxLivePos.prevZ) * 18

    // Inner shell: stiffer spring (K=0.055), moderate damping — snaps back fast
    const K_INNER = 0.055, D_INNER = 0.870
    for (let i = 0; i < INNER_N; i++) {
      const i3 = i * 3
      vel[i3]   += (sx + rest[i3]   - pos[i3])   * K_INNER + vkx
      vel[i3+1] += (sy + rest[i3+1] - pos[i3+1]) * K_INNER + vky
      vel[i3+2] += (sz + rest[i3+2] - pos[i3+2]) * K_INNER + vkz
      vel[i3]   *= D_INNER; vel[i3+1] *= D_INNER; vel[i3+2] *= D_INNER
      pos[i3]   += vel[i3]; pos[i3+1] += vel[i3+1]; pos[i3+2] += vel[i3+2]
    }

    // Outer shell: softer spring (K=0.022), higher damping — floats lazily
    const K_OUTER = 0.022, D_OUTER = 0.888
    for (let i = INNER_N; i < TOTAL_N; i++) {
      const i3 = i * 3
      vel[i3]   += (sx + rest[i3]   - pos[i3])   * K_OUTER + vkx * 0.5
      vel[i3+1] += (sy + rest[i3+1] - pos[i3+1]) * K_OUTER + vky * 0.5
      vel[i3+2] += (sz + rest[i3+2] - pos[i3+2]) * K_OUTER + vkz * 0.5
      vel[i3]   *= D_OUTER; vel[i3+1] *= D_OUTER; vel[i3+2] *= D_OUTER
      pos[i3]   += vel[i3]; pos[i3+1] += vel[i3+1]; pos[i3+2] += vel[i3+2]
    }

    attr.needsUpdate = true

    if (matRef.current) {
      const p         = exhibitionState.scrollProgress
      const t         = exhibitionState.introT
      const introFade = Math.max(0, Math.min(1, (t - 1.2) / 3.8))
      const dissolve  = p < 0.78 ? 1 : Math.max(0, (0.90 - p) / 0.12)
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        introFade * dissolve * 0.90,
        0.05,
      )
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        ref={matRef}
        color="#d4a840"
        size={0.022}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
