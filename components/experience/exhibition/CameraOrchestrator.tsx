'use client'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { exhibitionState } from './exhibitionState'

type KF = { p: number; [k: string]: number }

function interp(kfs: KF[], rawP: number): Record<string, number> {
  const p = Math.max(0, Math.min(1, rawP))
  let lo = kfs[0], hi = kfs[kfs.length - 1]
  for (let i = 0; i < kfs.length - 1; i++) {
    if (p >= kfs[i].p && p <= kfs[i + 1].p) { lo = kfs[i]; hi = kfs[i + 1]; break }
  }
  const span = hi.p - lo.p
  const t = span === 0 ? 0 : (p - lo.p) / span
  const s = t * t * (3 - 2 * t)
  const out: Record<string, number> = {}
  for (const k of Object.keys(lo)) if (k !== 'p') out[k] = lo[k] + (hi[k] - lo[k]) * s
  return out
}

// Camera never stays still — subtle idle drift so the scene feels alive.
// Three overlapping sine waves at different frequencies = organic micro-movement.
function idleDrift(t: number) {
  return {
    x: Math.sin(t * 0.23) * 0.006 + Math.sin(t * 0.41) * 0.003,
    y: Math.sin(t * 0.17) * 0.005 + Math.sin(t * 0.31) * 0.002,
    z: Math.sin(t * 0.11) * 0.003,
  }
}

// Room 1: Instrument — camera stays close, saxophone fills frame
// Rooms 2-4: gentle progression, never pulling far back
const CAM_KF: KF[] = [
  { p: 0.00, x:  0.0, y:  0.0, z: 7.0, fov: 46 },
  { p: 0.20, x: -0.3, y:  0.2, z: 7.0, fov: 45 },
  { p: 0.28, x: -0.3, y: -0.4, z: 7.2, fov: 45 },  // entering room 2
  { p: 0.40, x:  0.2, y: -0.8, z: 7.5, fov: 44 },
  { p: 0.55, x:  0.1, y: -1.0, z: 7.8, fov: 44 },  // entering room 3
  { p: 0.70, x:  0.0, y: -0.6, z: 8.2, fov: 43 },
  { p: 0.78, x:  0.0, y:  0.2, z: 8.5, fov: 43 },  // entering room 4
  { p: 0.88, x:  0.0, y:  0.5, z: 9.5, fov: 42 },
  { p: 1.00, x:  0.0, y:  0.9, z: 11,  fov: 40 },
]

export default function CameraOrchestrator() {
  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const t   = state.clock.getElapsedTime()
    const p   = exhibitionState.progress
    const px  = exhibitionState.pointerX
    const py  = exhibitionState.pointerY
    const kf  = interp(CAM_KF, p)
    const drift = idleDrift(t)

    // Cinematic intro: camera pushes from z:14 → z:7 in the first 4 seconds
    const introZ = 14 + (7 - 14) * Math.min(1, t / 4.0)
    // Blend: intro controls the first 4s, then scroll takes over cleanly
    const introWeight = Math.max(0, 1 - t / 4.0)
    const targetZ = introWeight * introZ + (1 - introWeight) * kf.z

    // Cursor parallax + scroll path + idle drift
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, kf.x + px * 0.45 + drift.x, 0.04)
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, kf.y + py * 0.30 + drift.y, 0.04)
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ + drift.z, 0.04)

    // Slight camera nudge toward hovered card azimuth
    if (exhibitionState.hoveredCard !== -1) {
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, cam.position.x + px * 0.08, 0.03)
    }

    cam.fov = THREE.MathUtils.lerp(cam.fov, kf.fov, 0.04)
    cam.updateProjectionMatrix()
    cam.lookAt(0, 0, 0)
  })
  return null
}
