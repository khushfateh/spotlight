'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, useGLTF, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sceneState } from './sceneState'

// ── Keyframe interpolation ────────────────────────────────────────────────────

type KF = { p: number; [key: string]: number }

function interpolate(kfs: KF[], rawProgress: number): Record<string, number> {
  const p = Math.max(0, Math.min(1, rawProgress))
  let lo = kfs[0]
  let hi = kfs[kfs.length - 1]
  for (let i = 0; i < kfs.length - 1; i++) {
    if (p >= kfs[i].p && p <= kfs[i + 1].p) {
      lo = kfs[i]; hi = kfs[i + 1]; break
    }
  }
  const span = hi.p - lo.p
  const t = span === 0 ? 0 : (p - lo.p) / span
  // Smooth cubic ease-in-out
  const s = t * t * (3 - 2 * t)
  const out: Record<string, number> = {}
  for (const k of Object.keys(lo)) {
    if (k !== 'p') out[k] = lo[k] + (hi[k] - lo[k]) * s
  }
  return out
}

// ── Saxophone position / scale / opacity keyframes ───────────────────────────
// x/y = world offset added on top of centered origin
// scale = uniform model scale
// opacity = material opacity (1 = solid, 0 = fully dissolved)

const SAX_KF: KF[] = [
  { p: 0.00, x: 0,     y: 0,    z: 0,    scale: 1.00, opacity: 1.00 },
  { p: 0.18, x: 0.35,  y: 0.15, z: 0,    scale: 1.00, opacity: 1.00 },
  { p: 0.38, x: 0.5,   y: -0.2, z: -0.2, scale: 0.92, opacity: 1.00 },
  { p: 0.58, x: 0.2,   y: 0.3,  z: -0.4, scale: 0.82, opacity: 0.92 },
  { p: 0.72, x: 0,     y: 0.7,  z: -0.5, scale: 0.72, opacity: 0.55 },
  { p: 0.84, x: 0,     y: 1.4,  z: -0.7, scale: 0.50, opacity: 0.00 },
  { p: 1.00, x: 0,     y: 2.2,  z: -0.9, scale: 0.35, opacity: 0.00 },
]

// ── Camera waypoints ──────────────────────────────────────────────────────────

const CAM_KF: KF[] = [
  { p: 0.00, x: 0,    y: 0,    z: 7,   fov: 46 },
  { p: 0.18, x: -0.5, y: 0.3,  z: 7.8, fov: 45 },
  { p: 0.38, x: 0.35, y: -0.1, z: 8.5, fov: 44 },
  { p: 0.58, x: 0,    y: 0.5,  z: 10,  fov: 43 },
  { p: 0.75, x: 0,    y: 0.9,  z: 12,  fov: 42 },
  { p: 0.88, x: 0,    y: 1.8,  z: 14,  fov: 40 },
  { p: 1.00, x: 0,    y: 2.4,  z: 16,  fov: 38 },
]

// ── Studio lighting ───────────────────────────────────────────────────────────

function StudioLighting() {
  return (
    <Environment resolution={512}>
      <Lightformer intensity={6}   position={[0, 5, 6]}     scale={[16, 1.4, 1]} color="#fff7e0" />
      <Lightformer intensity={5}   position={[-3.5, 2, 5]}  scale={[1.2, 14, 1]} color="#ffe7b0" />
      <Lightformer intensity={4.5} position={[3.5, -1, 5]}  scale={[1.2, 14, 1]} color="#ffcf73" />
      <Lightformer intensity={3}   position={[-7, 2, 1]}    scale={[8, 10, 1]}   color="#e6b85c" />
      <Lightformer intensity={0.2} position={[0, -6, -4]}   scale={[18, 12, 1]}  color="#120c04" />
    </Environment>
  )
}

// ── Saxophone scene ───────────────────────────────────────────────────────────

function SaxophoneScene() {
  const { scene } = useGLTF('/models/saxophone.glb')
  const groupRef   = useRef<THREE.Group>(null)
  const matsRef    = useRef<THREE.MeshStandardMaterial[]>([])

  const model = useMemo(() => {
    const clone = scene.clone(true)

    // Fit to 5.3 world units + centre on origin
    const box  = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    clone.scale.setScalar(5.3 / (Math.max(size.x, size.y, size.z) || 1))
    box.setFromObject(clone)
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.sub(center)

    // Collect unique materials, enhance, and enable transparency for dissolution
    const matSet = new Set<THREE.MeshStandardMaterial>()
    clone.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const mat = o.material
      if (!mat || Array.isArray(mat) || !('metalness' in mat)) return
      matSet.add(mat as THREE.MeshStandardMaterial)
    })
    matSet.forEach((m) => {
      m.metalness         = 0.5
      m.roughness         = Math.min(m.roughness ?? 0.4, 0.34)
      m.envMapIntensity   = 2.6
      m.emissive          = new THREE.Color('#5a3c0a')
      m.emissiveIntensity = 0.45
      m.transparent       = true  // required for opacity → 0 dissolution
      m.needsUpdate       = true
    })
    matsRef.current = Array.from(matSet)
    return clone
  }, [scene])

  useFrame((state) => {
    if (!groupRef.current) return
    const t  = state.clock.getElapsedTime()
    const p  = sceneState.progress
    const kf = interpolate(SAX_KF, p)

    // Position — keyframe + cursor parallax + breathing float
    const breathe = Math.sin(t * 0.5) * 0.04
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, kf.x + state.pointer.x * 0.08, 0.05)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, kf.y + breathe + state.pointer.y * 0.05, 0.05)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, kf.z, 0.04)

    // Rotation — 2 full turns of scroll + subtle cursor lean
    const scrollRot  = p * Math.PI * 4
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, scrollRot + state.pointer.x * 0.14, 0.04)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.09, 0.04)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, state.pointer.x * 0.04, 0.04)

    // Scale
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, kf.scale, 0.04))

    // Dissolve — lerp material opacity to keyframe target
    for (const m of matsRef.current) {
      m.opacity = THREE.MathUtils.lerp(m.opacity, kf.opacity, 0.06)
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload('/models/saxophone.glb')

// ── Cursor light ──────────────────────────────────────────────────────────────

function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (!lightRef.current) return
    lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, state.pointer.x * 5, 0.08)
    lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, state.pointer.y * 4, 0.08)
  })
  return <pointLight ref={lightRef} position={[0, 0, 4.5]} color="#ffecc0" intensity={28} distance={9} decay={2} />
}

// ── Scroll-driven camera ──────────────────────────────────────────────────────

function CameraRig() {
  useFrame((state) => {
    const p  = sceneState.progress
    const kf = interpolate(CAM_KF, p)
    const cam = state.camera as THREE.PerspectiveCamera

    cam.position.x = THREE.MathUtils.lerp(cam.position.x, kf.x + state.pointer.x * 0.28, 0.04)
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, kf.y + state.pointer.y * 0.18, 0.04)
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, kf.z, 0.04)
    cam.fov        = THREE.MathUtils.lerp(cam.fov, kf.fov, 0.04)
    cam.updateProjectionMatrix()
    cam.lookAt(0, 0, 0)
  })
  return null
}

// ── Ambient sparkle field ─────────────────────────────────────────────────────

function AmbientField() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 1.6, 0.04)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, state.pointer.y * 1.0, 0.04)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.2, 0.03)
  })
  return (
    <group ref={groupRef}>
      <Sparkles count={500} scale={[24, 18, 12]} size={1.1} speed={0.32} opacity={0.85} color="#f3cf86" noise={2.2} />
      <Sparkles count={180} scale={[20, 14, 10]} size={2.4} speed={0.18} opacity={0.45} color="#ffffff"  noise={1.6} />
      <Sparkles count={90}  scale={[14, 10, 7]}  size={4.2} speed={0.12} opacity={0.28} color="#e6b85c" noise={1.0} />
    </group>
  )
}

// ── Desert dust — four layers that dissolve the saxophone into gold ───────────

function DustLayer({
  count, xr, yr, zr, color, size, yOff = 0, startP = 0.72, maxOp = 1.0,
}: {
  count: number; xr: number; yr: number; zr: number
  color: string; size: number
  yOff?: number; startP?: number; maxOp?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef    = useRef<THREE.PointsMaterial>(null)

  // Build geometry once — imperatively, gives full BufferAttribute control
  useEffect(() => {
    const points = pointsRef.current
    if (!points) return
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * xr
      pos[i * 3 + 1] = (Math.random() - 0.5) * yr + yOff
      pos[i * 3 + 2] = (Math.random() - 0.5) * zr
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    points.geometry.dispose()
    points.geometry = geo
    return () => geo.dispose()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (!matRef.current) return
    const t = Math.max(0, Math.min(1, (sceneState.progress - startP) / 0.14))
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, t * maxOp, 0.05)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        ref={matRef}
        color={color}
        size={size}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function DesertDust() {
  return (
    <>
      {/* Ground carpet — dense, flat, warm gold */}
      <DustLayer count={1100} xr={42} yr={1.4} zr={14} color="#c9a84c" size={0.044} yOff={-4.5} startP={0.72} maxOp={0.95} />
      {/* Low drift — slightly above ground */}
      <DustLayer count={480}  xr={34} yr={4.5} zr={11} color="#d4a840" size={0.06}  yOff={-3.0} startP={0.74} maxOp={0.72} />
      {/* Rising column */}
      <DustLayer count={300}  xr={26} yr={11}  zr={9}  color="#f3cf86" size={0.05}  yOff={-1.0} startP={0.76} maxOp={0.55} />
      {/* Ember flares — large glowing dots */}
      <DustLayer count={90}   xr={20} yr={16}  zr={7}  color="#e6b85c" size={0.12}  yOff={1.0}  startP={0.78} maxOp={0.42} />
      {/* Fine mist — wide, high, ethereal */}
      <DustLayer count={380}  xr={40} yr={20}  zr={15} color="#fff3d0" size={0.025} yOff={2.5}  startP={0.74} maxOp={0.38} />
    </>
  )
}

// ── In-canvas loading indicator ───────────────────────────────────────────────

function CanvasLoader() {
  const { progress } = useProgress()
  if (progress >= 100) return null
  return (
    <Html center>
      <div style={{ textAlign: 'center', color: '#c9a84c' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid #c9a84c',
          animation: 'spin 0.9s linear infinite',
          margin: '0 auto',
        }} />
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 10, color: '#a3a3a3' }}>
          {Math.round(progress)}%
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Html>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function StickyScene() {
  // Wire GSAP progress: maps full page scroll → sceneState.progress (0–1)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    sceneState.progress = 0

    const tween = gsap.to(sceneState, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <div style={{ position: 'sticky', top: 0, height: '100svh', zIndex: 2 }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 46 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 1.28 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />

        <Suspense fallback={<CanvasLoader />}>
          <StudioLighting />
          <SaxophoneScene />
          <CursorLight />
          <AmbientField />
          <DesertDust />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  )
}
