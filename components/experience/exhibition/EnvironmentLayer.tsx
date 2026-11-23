'use client'

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { homeState as exhibitionState, saxLivePos } from './homeState'

// ── Frequency rings — vinyl-groove rings around the saxophone ─────────────────
function FrequencyRings() {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]
  useFrame((_, dt) => {
    refs.forEach((r, i) => {
      if (!r.current) return
      r.current.rotation.z += dt * (0.06 + i * 0.025)
      r.current.rotation.x = 0.32 + i * 0.11
    })
  })
  return (
    <group>
      {([3.8, 5.2, 6.9] as const).map((r, i) => (
        <mesh key={i} ref={refs[i]}>
          <torusGeometry args={[r, 0.008 + i * 0.003, 3, 96]} />
          <meshBasicMaterial
            color="#C9A84C"
            transparent
            opacity={0.045 - i * 0.012}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Procedural sheet music texture ───────────────────────────────────────────
function makeSheetMusicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 320; canvas.height = 200
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 320, 200)
  ctx.strokeStyle = 'rgba(201,168,76,0.7)'
  ctx.lineWidth = 1
  // Staff lines
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(12, 70 + i * 12); ctx.lineTo(308, 70 + i * 12); ctx.stroke()
  }
  // Random note heads
  const noteXs = [40, 80, 115, 158, 200, 242, 280]
  noteXs.forEach((x, i) => {
    const y = 64 + (i % 5) * 12
    ctx.fillStyle = 'rgba(201,168,76,0.85)'
    ctx.beginPath(); ctx.ellipse(x, y, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y - 28); ctx.stroke()
  })
  // Treble clef (simplified)
  ctx.strokeStyle = 'rgba(201,168,76,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(22, 118); ctx.bezierCurveTo(14, 78, 30, 64, 22, 58); ctx.stroke()
  return new THREE.CanvasTexture(canvas)
}

function SheetMusicFragments() {
  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null
    return makeSheetMusicTexture()
  }, [])
  const groupRef = useRef<THREE.Group>(null)
  const mounts = useMemo<{ pos: [number,number,number]; rot: [number,number,number]; scale: number }[]>(() =>
    Array.from({ length: 14 }, () => ({
      pos:   [(Math.random()-0.5)*34, (Math.random()-0.5)*22, (Math.random()-0.5)*20 - 8] as [number,number,number],
      rot:   [(Math.random()-0.5)*0.4, (Math.random()-0.5)*Math.PI*2, (Math.random()-0.5)*0.3] as [number,number,number],
      scale: 1.4 + Math.random() * 1.2,
    })),
  [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(t * 0.08 + i * 1.3) * 0.0006
      child.rotation.z += Math.sin(t * 0.05 + i * 0.9) * 0.0002
    })
  })

  if (!texture) return null

  return (
    <group ref={groupRef}>
      {mounts.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={m.rot} scale={m.scale}>
          <planeGeometry args={[1.6, 1.0]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.04 + Math.random() * 0.04}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Volumetric haze sphere — wraps entire scene in a dark warm atmosphere ─────
function HazeSphere() {
  return (
    <mesh scale={28}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial
        color="#120800"
        side={THREE.BackSide}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Ambient sparkle field — large drift sparkles following cursor ──────────────
function AmbientSparkles() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, exhibitionState.pointerX * 1.6, 0.04,
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y, exhibitionState.pointerY * 1.0, 0.04,
    )
  })
  return (
    <group ref={groupRef}>
      <Sparkles count={220} scale={[24, 18, 14]} size={1.1}  speed={0.25} opacity={0.55} color="#f3cf86" noise={2.4} />
      <Sparkles count={90}  scale={[20, 14, 10]} size={2.4}  speed={0.14} opacity={0.32} color="#ffffff"  noise={1.8} />
      <Sparkles count={45}  scale={[14, 10, 8]}  size={4.2}  speed={0.09} opacity={0.20} color="#e6b85c" noise={1.2} />
    </group>
  )
}

// ── Desert dust — appears in Room 4 (progress 0.70+) ─────────────────────────
function DustLayer({
  count, xr, yr, zr, color, size, yOff = 0, startP = 0.70, maxOp = 1,
}: {
  count: number; xr: number; yr: number; zr: number
  color: string; size: number; yOff?: number; startP?: number; maxOp?: number
}) {
  const ptsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  useEffect(() => {
    const pts = ptsRef.current; if (!pts) return
    const geo = new THREE.BufferGeometry()
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i*3]   = (Math.random()-0.5) * xr
      arr[i*3+1] = (Math.random()-0.5) * yr + yOff
      arr[i*3+2] = (Math.random()-0.5) * zr
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    const old = pts.geometry; pts.geometry = geo; old.dispose()
    return () => geo.dispose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (!matRef.current) return
    const t = Math.max(0, Math.min(1, (exhibitionState.scrollProgress - startP) / 0.16))
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, t * maxOp, 0.05)
  })

  return (
    <points ref={ptsRef}>
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
      <DustLayer count={1600} xr={50} yr={0.8} zr={16} color="#c9a84c" size={0.040} yOff={-2.4} startP={0.68} maxOp={0.90} />
      <DustLayer count={650}  xr={42} yr={3.0} zr={14} color="#d4a840" size={0.058} yOff={-1.6} startP={0.70} maxOp={0.68} />
      <DustLayer count={400}  xr={30} yr={5.5} zr={12} color="#f3cf86" size={0.048} yOff={-0.7} startP={0.72} maxOp={0.50} />
      <DustLayer count={110}  xr={22} yr={4.0} zr={10} color="#e6b85c" size={0.130} yOff={-0.3} startP={0.74} maxOp={0.38} />
      <DustLayer count={440}  xr={44} yr={3.5} zr={16} color="#fff3d0" size={0.022} yOff={-0.8} startP={0.70} maxOp={0.34} />
    </>
  )
}

// ── Room atmosphere shift — changes scene fog colour per room ─────────────────
function RoomAtmosphere() {
  useFrame((state) => {
    const p = exhibitionState.scrollProgress
    // Room 1: cold dark void
    // Room 2: warm amber rises
    // Room 3: deep emerald
    // Room 4: violet pulse
    const amber  = Math.max(0, Math.min(1, (p - 0.28) / 0.27))
    const emerald = Math.max(0, Math.min(1, (p - 0.55) / 0.23))
    const violet = Math.max(0, Math.min(1, (p - 0.78) / 0.22))
    const r = 0.02 + amber * 0.08 + violet * 0.05
    const g = 0.02 + amber * 0.04 + emerald * 0.06
    const b = 0.03 + emerald * 0.04 + violet * 0.12
    ;(state.scene.background as THREE.Color)?.set(r, g, b)
  })
  return null
}

export default function EnvironmentLayer() {
  return (
    <>
      <HazeSphere />
      <FrequencyRings />
      <AmbientSparkles />
      <DesertDust />
      <RoomAtmosphere />
    </>
  )
}
