'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  Sparkles,
  Environment,
  Lightformer,
  useProgress,
  Html,
} from '@react-three/drei'
import * as THREE from 'three'
import { scrollState } from './scrollState'

// ── Loading overlay rendered inside the Canvas ────────────────────────────────
function Loader() {
  const { progress } = useProgress()
  if (progress >= 100) return null
  return (
    <Html center>
      <div style={{ textAlign: 'center', color: '#c9a84c' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid #c9a84c',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto',
          }}
        />
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 12,
            color: '#a3a3a3',
          }}
        >
          Summoning the icon · {Math.round(progress)}%
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Html>
  )
}

// ── Sparkle field — 3 density tiers, follows pointer ─────────────────────────
function SparkleField() {
  const g = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!g.current) return
    g.current.position.x = THREE.MathUtils.lerp(
      g.current.position.x,
      state.pointer.x * 1.4,
      0.05,
    )
    g.current.position.y = THREE.MathUtils.lerp(
      g.current.position.y,
      state.pointer.y * 1.0,
      0.05,
    )
    g.current.rotation.y = THREE.MathUtils.lerp(
      g.current.rotation.y,
      state.pointer.x * 0.5,
      0.04,
    )
  })

  return (
    <group ref={g}>
      {/* Fine gold dust — background stars */}
      <Sparkles
        count={650}
        scale={[15, 11, 9]}
        size={1.1}
        speed={0.4}
        opacity={0.95}
        color="#f3cf86"
        noise={2.2}
      />
      {/* White sparkles — mid-field */}
      <Sparkles
        count={260}
        scale={[12, 9, 7]}
        size={2.4}
        speed={0.22}
        opacity={0.6}
        color="#ffffff"
        noise={1.6}
      />
      {/* Large amber flares — foreground */}
      <Sparkles
        count={120}
        scale={[9, 7, 6]}
        size={4}
        speed={0.15}
        opacity={0.4}
        color="#e6b85c"
        noise={1}
      />
    </group>
  )
}

// ── Camera parallax rig ───────────────────────────────────────────────────────
function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      state.pointer.x * 0.5,
      0.04,
    )
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 0.35,
      0.04,
    )
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ── Saxophone model ───────────────────────────────────────────────────────────
function SaxophoneModel() {
  const { scene } = useGLTF('/models/saxophone.glb')
  const group = useRef<THREE.Group>(null)

  const model = useMemo(() => {
    const clone = scene.clone(true)

    // Auto-scale: fit to 5.3 world units so the full instrument is visible
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    clone.scale.setScalar(5.3 / maxAxis)

    // Center on origin
    box.setFromObject(clone)
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.sub(center)

    // Enhance materials — keep original maps, boost metallic / emissive
    clone.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const mat = o.material
      if (!mat || Array.isArray(mat)) return
      if (!('metalness' in mat)) return
      const m = mat as THREE.MeshStandardMaterial
      m.metalness = 0.5
      m.roughness = Math.min(m.roughness ?? 0.4, 0.34)
      m.envMapIntensity = 2.6
      // Warm inner glow — the secret to brass looking alive
      m.emissive = new THREE.Color('#5a3c0a')
      m.emissiveIntensity = 0.45
      m.needsUpdate = true
    })

    return clone
  }, [scene])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()

    // Scroll drives rotation; idle drift adds a slow organic spin between scrolls
    const targetY = scrollState.rotation + t * 0.08
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      targetY,
      0.06,
    )

    // Pointer tilt — subtle x-axis response to mouse
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.pointer.y * 0.12,
      0.04,
    )

    // Breathing — gentle Y float
    group.current.position.y = Math.sin(t * 0.5) * 0.045
  })

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload('/models/saxophone.glb')

// ── Custom Environment (Lightformers only — no HDRI download needed) ──────────
function StudioLighting() {
  return (
    <Environment resolution={512}>
      {/* Horizontal strip top — broad specular highlight across body */}
      <Lightformer
        intensity={6}
        position={[0, 5, 6]}
        scale={[16, 1.4, 1]}
        color="#fff7e0"
      />
      {/* Left vertical strip — shimmering streak down left flank */}
      <Lightformer
        intensity={5}
        position={[-3.5, 2, 5]}
        scale={[1.2, 14, 1]}
        color="#ffe7b0"
      />
      {/* Right vertical strip — counterpart streak */}
      <Lightformer
        intensity={4.5}
        position={[3.5, -1, 5]}
        scale={[1.2, 14, 1]}
        color="#ffcf73"
      />
      {/* Left ambient fill — warm gold bounce */}
      <Lightformer
        intensity={3}
        position={[-7, 2, 1]}
        scale={[8, 10, 1]}
        color="#e6b85c"
      />
      {/* Dark floor — deep shadows underneath */}
      <Lightformer
        intensity={0.2}
        position={[0, -6, -4]}
        scale={[18, 12, 1]}
        color="#120c04"
      />
    </Environment>
  )
}

// ── Canvas export ─────────────────────────────────────────────────────────────
export default function SaxophoneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 46 }}
      dpr={[1, 1.8]}
      gl={{
        antialias: true,
        alpha: true,
        toneMappingExposure: 1.15,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.45} />

      <Suspense fallback={<Loader />}>
        <StudioLighting />
        <SparkleField />
        <SaxophoneModel />
      </Suspense>

      <CameraRig />
    </Canvas>
  )
}
