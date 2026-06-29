'use client'

import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Module-level cursor — updated by window.mousemove, read by useFrame.
// Works even though the Canvas has pointer-events: none.
const cursor = { x: 0, y: 0 }

function StarField() {
  const g = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!g.current) return
    // Gentle lag so the field drifts toward the cursor rather than snapping
    g.current.position.x = THREE.MathUtils.lerp(g.current.position.x, cursor.x * 2.2, 0.04)
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, cursor.y * 1.6, 0.04)
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, cursor.x * 0.3, 0.03)
  })

  return (
    <group ref={g}>
      {/* Fine gold dust — densest, widest spread */}
      <Sparkles count={900} scale={[32, 22, 14]} size={1.0} speed={0.35} opacity={0.88} color="#f3cf86" noise={2.2} />
      {/* White mid-field */}
      <Sparkles count={350} scale={[28, 18, 12]} size={2.0} speed={0.20} opacity={0.50} color="#ffffff" noise={1.6} />
      {/* Large amber flares */}
      <Sparkles count={150} scale={[22, 14, 9]}  size={3.5} speed={0.13} opacity={0.28} color="#e6b85c" noise={1.0} />
    </group>
  )
}

export default function GlobalSparkles() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursor.x = (e.clientX / window.innerWidth)  * 2 - 1
      cursor.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,        // behind ALL page content, above body background
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 68 }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
        frameloop="always"
        style={{ width: '100%', height: '100%' }}
      >
        <StarField />
      </Canvas>
    </div>
  )
}
