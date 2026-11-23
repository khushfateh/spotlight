'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { exhibitionState, saxLivePos } from './exhibitionState'
import { creators } from '@/lib/mock-data/creators'

// Three orbital shells — different radii, speeds, tilts
const SHELLS = [
  { radius: 6.5,  speed: 0.018, tilt: 0.21,  count: 3 },
  { radius: 9.0,  speed: 0.011, tilt: -0.14, count: 4 },
  { radius: 12.0, speed: 0.007, tilt: 0.35,  count: 3 },
]

// Pre-assign artists to shells
const CARD_DEFS = SHELLS.flatMap((shell, si) =>
  Array.from({ length: shell.count }, (_, ci) => ({
    shell:  si,
    ci,
    initialAngle: (ci / shell.count) * Math.PI * 2,
    creatorIdx: si * 4 + ci,
  }))
).map((d, i) => ({ ...d, id: i }))

// Gold border frame rendered as inset ring
function GoldFrame({ w, h }: { w: number; h: number }) {
  return (
    <mesh position={[0, 0, 0.066]}>
      <RoundedBox args={[w, h, 0.008]} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          color="#C9A84C"
          metalness={0.9}
          roughness={0.15}
          emissive="#7a5a10"
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </RoundedBox>
    </mesh>
  )
}

// Individual glass card
function GlassCard({ def, angleRef, opacity }: {
  def: typeof CARD_DEFS[0]
  angleRef: React.MutableRefObject<number>
  opacity: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const glassRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)
  const prevHovered = useRef(false)
  const hoverOffset = useRef(0)

  const shell   = SHELLS[def.shell]
  const creator = creators[def.creatorIdx % creators.length]

  // Load artist image as texture
  const imageUrl = creator.imageUrl || '/placeholder.jpg'
  const texture  = useTexture(imageUrl)
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  }, [texture])

  useFrame((state) => {
    if (!groupRef.current) return
    const angle = angleRef.current

    // Orbital position on inclined ellipse
    const x = Math.cos(angle) * shell.radius
    const z = Math.sin(angle) * shell.radius * 0.72  // slightly compressed depth
    const y = Math.sin(angle + def.initialAngle * 0.5) * 0.8  // gentle up/down oscillation
    const inclinedY = y * Math.cos(shell.tilt) - z * Math.sin(shell.tilt) * 0.1

    // Offset from saxophone position (cards orbit the instrument)
    const tx = saxLivePos.x + x
    const ty = saxLivePos.y + inclinedY
    const tz = saxLivePos.z + z * Math.cos(shell.tilt)

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, tx, 0.04)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, ty, 0.04)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, tz, 0.04)

    // Billboard — always face the camera
    groupRef.current.quaternion.copy(state.camera.quaternion)

    // Hover: push toward camera + light up
    const targetHover = hovered ? 1 : 0
    hoverOffset.current = THREE.MathUtils.lerp(hoverOffset.current, targetHover, 0.08)
    if (hoverOffset.current > 0.001) {
      const fwd = new THREE.Vector3()
      state.camera.getWorldDirection(fwd)
      fwd.negate().multiplyScalar(hoverOffset.current * 0.55)
      groupRef.current.position.add(fwd)
    }

    // Nudge global camera drift toward hovered card
    if (hovered && !prevHovered.current) {
      exhibitionState.hoveredCard = def.id
    } else if (!hovered && prevHovered.current && exhibitionState.hoveredCard === def.id) {
      exhibitionState.hoveredCard = -1
    }
    prevHovered.current = hovered

    // Cursor light brightness
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity, hoverOffset.current * 3.5, 0.08,
      )
    }

    // Distance-based fade: far side of orbit dims
    const dist = groupRef.current.position.distanceTo(state.camera.position)
    const maxD = shell.radius + 14
    const distFade = 1 - THREE.MathUtils.clamp((dist - 8) / (maxD - 8), 0, 1) * 0.55
    if (glassRef.current) {
      const mat = glassRef.current.material as THREE.MeshPhysicalMaterial
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacity * distFade, 0.05)
    }
  })

  return (
    <group
      ref={groupRef}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair' }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = '' }}
    >
      {/* Glass body */}
      <RoundedBox ref={glassRef} args={[2.1, 2.9, 0.11]} radius={0.07} smoothness={4}>
        <meshPhysicalMaterial
          color="#0d0808"
          transmission={0.82}
          thickness={0.45}
          roughness={0.04}
          metalness={0.0}
          ior={1.52}
          envMapIntensity={2.2}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Artist image slide inside glass */}
      {texture && (
        <mesh position={[0, 0.15, 0]}>
          <planeGeometry args={[1.88, 2.2]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Gold inset border frame */}
      <GoldFrame w={2.1} h={2.9} />

      {/* Hover point light */}
      <pointLight ref={lightRef} color="#ffecc0" intensity={0} distance={5} decay={2} />

      {/* Artist label — Html rendered below card in screen space */}
      <Html
        position={[0, -1.65, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        zIndexRange={[0, 0]}
      >
        <div style={{
          color: hovered ? '#E8C96A' : '#C9A84C',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          textAlign: 'center',
          transition: 'color 0.3s',
          textShadow: '0 0 12px rgba(201,168,76,0.5)',
          opacity: 0.9,
        }}>
          <div style={{ fontWeight: 500 }}>{creator.name}</div>
          <div style={{ marginTop: 4, color: '#666', letterSpacing: '0.18em', fontSize: '7px' }}>
            {creator.category}
          </div>
        </div>
      </Html>
    </group>
  )
}

export default function OrbitalCards() {
  // One angle ref per card, advances each frame
  const angleRefs = useRef<React.MutableRefObject<number>[]>(
    CARD_DEFS.map(d => ({ current: d.initialAngle }))
  )
  const opacityRef = useRef(0)

  useFrame((_, dt) => {
    // Advance each card's angle
    CARD_DEFS.forEach((def, i) => {
      angleRefs.current[i].current += SHELLS[def.shell].speed * dt
    })

    // Cards fade in at t=5s (after saxophone intro)
    const t = exhibitionState.introT
    const p = exhibitionState.progress
    const introFade = Math.max(0, Math.min(1, (t - 5.0) / 2.0))
    const dissolve  = p < 0.78 ? 1 : Math.max(0, (0.90 - p) / 0.12)
    opacityRef.current = introFade * dissolve
  })

  return (
    <>
      {CARD_DEFS.map((def, i) => (
        <GlassCard
          key={def.id}
          def={def}
          angleRef={angleRefs.current[i]}
          opacity={opacityRef.current}
        />
      ))}
    </>
  )
}
