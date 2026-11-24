import { useEffect, useMemo } from 'react'
import { Dimensions, Platform, View } from 'react-native'
import {
  Canvas,
  Rect,
  RoundedRect,
  Circle,
  Group,
  BlurMask,
  LinearGradient as SkLinearGradient,
  vec,
  Skia,
} from '@shopify/react-native-skia'
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'

const W = Dimensions.get('window').width
const H = 220

// ─── Piano layout constants ────────────────────────────────────────────────────
const NUM_WHITE  = 16     // 2+ octaves
const WHITE_W    = W / NUM_WHITE
const WHITE_H    = H * 0.75
const BLACK_W    = WHITE_W * 0.62
const BLACK_H    = WHITE_H * 0.62
const KEY_Y      = H * 0.26  // y position of key tops

// Black key pattern (1 = black key after white key index)
const BLACK_AFTER = new Set([0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15])

// Keys that glow (animated, cycling)
const GLOW_KEYS = [2, 7, 5, 11, 4, 9]

// ─── Web fallback ──────────────────────────────────────────────────────────────
function PianoFallback() {
  return <View style={{ width: W, height: H }} />
}

export default function PianoCanvas({ scrollProgress = 0 }: { scrollProgress?: number }) {
  if (Platform.OS === 'web') return <PianoFallback />
  return <PianoSkia scrollProgress={scrollProgress} />
}

function PianoSkia({ scrollProgress }: { scrollProgress: number }) {
  // Ambient glow cycling through keys
  const glowCycle = useSharedValue(0)
  const entryT    = useSharedValue(0)

  useEffect(() => {
    entryT.value   = withDelay(300, withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }))
    glowCycle.value = withRepeat(
      withTiming(GLOW_KEYS.length, { duration: GLOW_KEYS.length * 1800 }),
      -1, false,
    )
  }, [])

  const opacity = useDerivedValue(() => (1 - scrollProgress * 0.6) * entryT.value * 0.9)

  // Build white key rects
  const whiteKeyPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make()
    for (let i = 0; i < NUM_WHITE; i++) {
      const x = i * WHITE_W
      builder.addRect(Skia.XYWHRect(x + 1, KEY_Y, WHITE_W - 2, WHITE_H))
    }
    return builder.detach()
  }, [])

  // Build black key rects
  const blackKeyPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make()
    for (let i = 0; i < NUM_WHITE; i++) {
      if (BLACK_AFTER.has(i)) {
        const x = (i + 1) * WHITE_W - BLACK_W / 2
        builder.addRRect(Skia.RRectXY(Skia.XYWHRect(x, KEY_Y, BLACK_W, BLACK_H), 2, 2))
      }
    }
    return builder.detach()
  }, [])

  // Per-key glow paths (one per glow key)
  const glowPaths = useMemo(() =>
    GLOW_KEYS.map(keyIdx => {
      const builder = Skia.PathBuilder.Make()
      const x = keyIdx * WHITE_W
      builder.addRect(Skia.XYWHRect(x + 1, KEY_Y, WHITE_W - 2, WHITE_H))
      return builder.detach()
    }), [])

  return (
    <Canvas
      style={{ width: W, height: H }}
      pointerEvents="none"
    >
      <Group opacity={opacity}>
        {/* Key glows (cycling) */}
        {glowPaths.map((path, i) => {
          const keyGlowOpacity = useDerivedValue(() => {
            const t = glowCycle.value - i
            if (t < 0 || t > 1.5) return 0
            return Math.max(0, 1 - Math.abs(t - 0.5) * 2.5) * 0.5
          })
          return (
            <Group key={i} opacity={keyGlowOpacity}>
              <Rect
                x={GLOW_KEYS[i] * WHITE_W + 1}
                y={KEY_Y}
                width={WHITE_W - 2}
                height={WHITE_H}
                color="rgba(201,168,76,0.4)"
              >
                <BlurMask blur={12} style="outer" />
              </Rect>
            </Group>
          )
        })}

        {/* White keys — dim fill */}
        <Group>
          <Rect x={0} y={KEY_Y} width={W} height={WHITE_H + 1} color="rgba(5,5,8,1)" />
          {Array.from({ length: NUM_WHITE }, (_, i) => (
            <Rect
              key={i}
              x={i * WHITE_W + 1}
              y={KEY_Y}
              width={WHITE_W - 2}
              height={WHITE_H}
              color="rgba(255,255,255,0.03)"
            />
          ))}
          {/* White key borders */}
          <Group>
            {Array.from({ length: NUM_WHITE + 1 }, (_, i) => (
              <Rect
                key={i}
                x={i * WHITE_W}
                y={KEY_Y}
                width={1}
                height={WHITE_H}
                color="rgba(201,168,76,0.08)"
              />
            ))}
          </Group>
          {/* Top border glow */}
          <Rect x={0} y={KEY_Y} width={W} height={1} color="rgba(201,168,76,0.18)" />
          {/* Bottom fade */}
          <Rect x={0} y={KEY_Y + WHITE_H - 20} width={W} height={20} color="rgba(5,5,8,0.9)" />
        </Group>

        {/* Black keys */}
        {Array.from({ length: NUM_WHITE }, (_, i) => {
          if (!BLACK_AFTER.has(i)) return null
          const x = (i + 1) * WHITE_W - BLACK_W / 2
          return (
            <Rect
              key={i}
              x={x}
              y={KEY_Y}
              width={BLACK_W}
              height={BLACK_H}
              color="rgba(5,5,8,0.95)"
            />
          )
        })}

        {/* Black key side borders */}
        {Array.from({ length: NUM_WHITE }, (_, i) => {
          if (!BLACK_AFTER.has(i)) return null
          const x = (i + 1) * WHITE_W - BLACK_W / 2
          return (
            <Group key={`bk${i}`}>
              <Rect x={x} y={KEY_Y} width={1} height={BLACK_H} color="rgba(201,168,76,0.08)" />
              <Rect x={x + BLACK_W - 1} y={KEY_Y} width={1} height={BLACK_H} color="rgba(201,168,76,0.08)" />
            </Group>
          )
        })}

        {/* Top ambient haze */}
        <Rect x={0} y={0} width={W} height={KEY_Y + 2}>
          <SkLinearGradient
            start={vec(0, 0)}
            end={vec(0, KEY_Y + 2)}
            colors={['rgba(5,5,8,1)', 'rgba(5,5,8,0)']}
          />
        </Rect>
      </Group>
    </Canvas>
  )
}
