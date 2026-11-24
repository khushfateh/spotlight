import { useEffect } from 'react'
import { Dimensions, Platform, StyleSheet, View } from 'react-native'
import { runOnJS, useSharedValue, useDerivedValue, withTiming, Easing } from 'react-native-reanimated'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'

const { width: W, height: H } = Dimensions.get('window')

// Pre-generate 72 particles: mix of near (small, fast) and far (large, slow)
const PARTICLES = Array.from({ length: 72 }, (_, i) => {
  const seed  = (i * 137.508) % 1
  const seed2 = (i * 93.11)   % 1
  const angle = (i / 72) * Math.PI * 2 + seed * 0.6 - 0.3
  // Two rings: inner fast-small, outer slow-large
  const isOuter  = i % 3 === 0
  const speed    = isOuter ? 180 + seed * 120 : 100 + seed2 * 100
  const r        = isOuter ? 2.5 + seed * 2.2 : 1.2 + seed * 1.8
  const isGold   = seed < 0.65
  const delay    = seed2 * 0.18  // staggered launch
  return { angle, speed, r, isGold, delay }
})

const GOLD_INDICES  = PARTICLES.map((p, i) => p.isGold  ? i : -1).filter(i => i >= 0)
const WHITE_INDICES = PARTICLES.map((p, i) => !p.isGold ? i : -1).filter(i => i >= 0)

type Props = {
  visible:    boolean
  originX?:   number
  originY?:   number
  onComplete: () => void
}

export default function SuccessFlare({ visible, originX, originY, onComplete }: Props) {
  if (Platform.OS === 'web') return null
  if (!visible) return null
  return (
    <SuccessFlareSkia
      originX={originX ?? W / 2}
      originY={originY ?? H * 0.42}
      onComplete={onComplete}
    />
  )
}

function SuccessFlareSkia({
  originX, originY, onComplete,
}: { originX: number; originY: number; onComplete: () => void }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = 0
    progress.value = withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(onComplete)()
    })
  }, [])

  const goldPath = useDerivedValue(() => {
    const p  = progress.value
    const builder = Skia.PathBuilder.Make()
    for (const i of GOLD_INDICES) {
      const pt   = PARTICLES[i]
      const t    = Math.max(0, (p - pt.delay) / (1 - pt.delay))
      if (t <= 0) continue
      const fade = Math.max(0, 1 - t * 1.4)
      if (fade <= 0.01) continue
      const x = originX + Math.cos(pt.angle) * pt.speed * t
      const y = originY + Math.sin(pt.angle) * pt.speed * t + 60 * t * t
      const r = pt.r * (1 - t * 0.4)
      if (r > 0.3) builder.addCircle(x, y, r)
    }
    return builder.detach()
  })

  const whitePath = useDerivedValue(() => {
    const p  = progress.value
    const builder = Skia.PathBuilder.Make()
    for (const i of WHITE_INDICES) {
      const pt   = PARTICLES[i]
      const t    = Math.max(0, (p - pt.delay) / (1 - pt.delay))
      if (t <= 0) continue
      const fade = Math.max(0, 1 - t * 1.4)
      if (fade <= 0.01) continue
      const x = originX + Math.cos(pt.angle) * pt.speed * t
      const y = originY + Math.sin(pt.angle) * pt.speed * t + 60 * t * t
      const r = pt.r * (1 - t * 0.4)
      if (r > 0.3) builder.addCircle(x, y, r)
    }
    return builder.detach()
  })

  const goldOpacity  = useDerivedValue(() => Math.max(0, 1 - progress.value * 1.3))
  const whiteOpacity = useDerivedValue(() => Math.max(0, 1 - progress.value * 1.5))

  return (
    <Canvas
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
    >
      <Path path={goldPath}  color="#C9A84C" style="fill" opacity={goldOpacity} />
      <Path path={whitePath} color="rgba(255,255,255,0.9)" style="fill" opacity={whiteOpacity} />
    </Canvas>
  )
}
