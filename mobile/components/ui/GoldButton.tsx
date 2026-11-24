/**
 * GoldButton — SPOTLIGHT's engraved-brass button (design B: mirrored engraved
 * end-caps, polished centre), lit live in a Skia shader from the saxophone
 * model's own engraving, with tilt-reactive light, a periodic sheen and a
 * stamped label. API unchanged from the original flat button, plus:
 *
 *   effect="crack"   — buttons that NAVIGATE: "The Fissure". One elegant crack
 *                      races from the tap toward the middle of the plate (under
 *                      the label, which stays intact); light leaks from it,
 *                      minute stardust lifts off and fine golden threads unfurl.
 *                      onPress fires at the light's crescendo (≈0.55 s).
 *   effect="strike"  — default; in-place actions: flash + sparks, onPress now.
 *
 * variant "primary" → brass plate · "outline" → engraved brass frame ·
 * "ghost" → plain text (unchanged). Reduce Motion → no fissure, press only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pressable, Text, ActivityIndicator, View, AccessibilityInfo, Platform,
  type ViewStyle, type TextStyle, type LayoutChangeEvent, type GestureResponderEvent,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated'
import {
  Canvas, Fill, Shader, ImageShader, Group, Path, Circle, BlurMask,
  Skia, useImage, type SkPath,
} from '@shopify/react-native-skia'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/lib/tokens'
import { useTilt, tiltX, tiltY } from '@/lib/hooks/useTilt'
import { BRASS_SKSL } from './brass/brassShader'
import {
  makeFissure, polylineSvg, fissureSpread, fissureGlow, fissureFlare, impactFlash, fissureDip,
  dustAt, threadAt, FISSURE_MS, FISSURE_NAVIGATE_AT, FISSURE_CRESCENDO_AT, type Dust,
} from './brass/fissure'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ENGRAVING = require('../../assets/textures/brass_engraving_normal.png')

const BRASS_EFFECT = Skia.RuntimeEffect.Make(BRASS_SKSL)
const PLATE_RADIUS = Radius.sm
const FALLBACK_BRASS = '#B8923F'   // shown for a frame before the shader is ready
const OVERLAY_MARGIN = 70          // room for stardust + threads to drift off the plate

// Reduce Motion (read once, kept in sync)
let reduceMotion = false
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = v }).catch(() => {})
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => { reduceMotion = v })

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'outline' | 'ghost'
type Effect = 'crack' | 'strike'

type Props = {
  children:   React.ReactNode
  onPress:    () => void
  variant?:   Variant
  loading?:   boolean
  disabled?:  boolean
  style?:     ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
  shimmer?:   boolean
  /** 'crack' for buttons that navigate; 'strike' (default) for in-place actions */
  effect?:    Effect
  /** 'sm' = compact plate (e.g. hero) */
  size?:      'md' | 'sm'
}

interface FissureState {
  w: number; h: number
  arms: SkPath[]
  branches: { path: SkPath; at: number }[]
  threads: { path: SkPath; at: number; dx: number; dy: number }[]
  dust: Dust[]
  tap: { x: number; y: number }
}

const svgPath = (svg: string) => Skia.Path.MakeFromSVGString(svg) ?? Skia.Path.Make()

export default function GoldButton({
  children,
  onPress,
  variant   = 'primary',
  loading   = false,
  disabled  = false,
  style,
  textStyle,
  fullWidth = false,
  shimmer   = false,
  effect    = 'strike',
  size      = 'md',
}: Props) {
  const isBrass = variant !== 'ghost'
  const image = useImage(isBrass ? ENGRAVING : null)
  useTilt(isBrass)

  const [box, setBox] = useState({ w: 0, h: 0 })
  const lastTouch = useRef({ x: 0, y: 0 })
  const mounted = useRef(true)
  const busy = useRef(false)
  useEffect(() => () => { mounted.current = false }, [])

  // ── Animated values ────────────────────────────────────────────────────────
  const press = useSharedValue(1)
  const sheen = useSharedValue(-1)
  const flare = useSharedValue(0)
  const crackT = useSharedValue(0)
  const crackFade = useSharedValue(1)
  const sparkT = useSharedValue(0)
  const spark = useSharedValue({ x: 0, y: 0 })
  const [fissure, setFissure] = useState<FissureState | null>(null)

  const shimmerOn = shimmer && variant === 'primary' && !loading
  useEffect(() => {
    if (!shimmerOn) { cancelAnimation(sheen); sheen.value = -1; return }
    sheen.value = -0.4
    sheen.value = withRepeat(
      withSequence(
        withTiming(-0.4, { duration: 0 }),
        withDelay(2700, withTiming(1.4, { duration: 900, easing: Easing.inOut(Easing.quad) })),
      ),
      -1,
      false,
    )
    return () => cancelAnimation(sheen)
  }, [shimmerOn, sheen])

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setBox((b) => (Math.abs(b.w - width) < 0.5 && Math.abs(b.h - height) < 0.5 ? b : { w: width, h: height }))
  }, [])

  // ── Shader uniforms (UI thread) ────────────────────────────────────────────
  const uniforms = useDerivedValue(() => ({
    uOrigin: [0, 0],
    uSize: [Math.max(1, box.w), Math.max(1, box.h)],
    uLight: [tiltX.value * 0.9, 0.5 + tiltY.value * 0.25, 0.6],
    uSheen: sheen.value,
    uFlare: Math.max(flare.value, fissureFlare(crackT.value) * crackFade.value),
    uMode: variant === 'outline' ? 1 : 0,
    uRadius: PLATE_RADIUS,
  }), [box.w, box.h, variant])

  // ── Press handling ─────────────────────────────────────────────────────────
  const canPress = !disabled && !loading

  const runStrike = (x: number, y: number) => {
    spark.value = { x, y }
    sparkT.value = 0
    sparkT.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })
    flare.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 420 }))
  }

  const runFissure = (x: number, y: number) => {
    const { w, h } = box
    const f = makeFissure(w, h, { x, y }, (Date.now() & 0xffffff) ^ Math.floor(Math.random() * 1e6))
    setFissure({
      w, h,
      arms: f.arms.map((a) => svgPath(polylineSvg(a))),
      branches: f.branches.map((b) => ({ path: svgPath(polylineSvg(b.pts)), at: b.at })),
      threads: f.threads.map((t) => ({ path: svgPath(t.svg), at: t.at, dx: t.dx, dy: t.dy })),
      dust: f.dust,
      tap: f.tap,
    })
    crackFade.value = 1
    crackT.value = 0
    crackT.value = withTiming(1, { duration: FISSURE_MS, easing: Easing.linear })

    setTimeout(() => {
      if (mounted.current && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }, Math.round(FISSURE_MS * FISSURE_CRESCENDO_AT))
    setTimeout(() => { if (mounted.current) onPress() }, Math.round(FISSURE_MS * FISSURE_NAVIGATE_AT))
    // Heal the plate afterwards (we're usually on the next screen by then)
    setTimeout(() => {
      if (!mounted.current) return
      crackFade.value = withTiming(0, { duration: 320 })
    }, FISSURE_MS + 250)
    setTimeout(() => {
      if (!mounted.current) return
      setFissure(null)
      crackT.value = 0
      busy.current = false
    }, FISSURE_MS + 650)
  }

  const handlePressIn = (e: GestureResponderEvent) => {
    lastTouch.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }
    press.value = withSpring(0.955, { damping: 22, stiffness: 500 })
  }
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 18, stiffness: 320 })
  }

  const handlePress = () => {
    if (!canPress || busy.current) return
    const { x, y } = lastTouch.current
    const motionOk = !reduceMotion && isBrass && box.w > 0
    if (effect === 'crack' && motionOk && BRASS_EFFECT) {
      busy.current = true
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      runFissure(x, y)
      return
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(isBrass && motionOk ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light)
    }
    if (motionOk) runStrike(x, y)
    onPress()
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const plateStyle = useAnimatedStyle(() => {
    const k = crackT.value > 0 && crackT.value < 1 ? fissureDip(crackT.value) : 1
    return { transform: [{ scale: press.value * k }] }
  })

  const textColor =
    variant === 'primary' ? '#2a1904' :
    variant === 'outline' ? Colors.brass :
    Colors.brassDim

  const stamped: TextStyle = variant === 'primary'
    ? { textShadowColor: 'rgba(255,238,195,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0.01 }
    : variant === 'outline'
      ? { textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
      : {}

  const sm = size === 'sm'
  const shaderReady = isBrass && !!image && !!BRASS_EFFECT && box.w > 0

  return (
    <View style={[{ width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.38 : 1 }, style]}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canPress}
        onLayout={onLayout}
        accessibilityRole="button"
        style={[plateStyle, {
          borderRadius:      PLATE_RADIUS,
          paddingVertical:   sm ? Spacing.sm + 3 : Spacing.sm + 5,
          paddingHorizontal: sm ? Spacing.lg : Spacing.lg + 4,
          alignItems:        'center',
          justifyContent:    'center',
          flexDirection:     'row',
          backgroundColor:   isBrass && !shaderReady
            ? (variant === 'primary' ? FALLBACK_BRASS : 'rgba(10,8,4,0.85)')
            : 'transparent',
          borderWidth:       isBrass && !shaderReady && variant === 'outline' ? 1 : 0,
          borderColor:       Colors.brass,
          ...(variant === 'primary' ? {
            shadowColor:   Colors.brass,
            shadowOffset:  { width: 0, height: 2 },
            shadowOpacity: 0.32,
            shadowRadius:  12,
            elevation:     6,
          } : {}),
        }]}
      >
        {shaderReady && (
          <Canvas style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: box.h }} pointerEvents="none">
            <Fill>
              <Shader source={BRASS_EFFECT!} uniforms={uniforms}>
                <ImageShader image={image} fit="fill" rect={{ x: 0, y: 0, width: box.w, height: box.h }} />
              </Shader>
            </Fill>
            {/* The fissure lives IN the plate, beneath the label */}
            {fissure && <FissureCrack f={fissure} t={crackT} fade={crackFade} />}
            <Sparks t={sparkT} at={spark} />
          </Canvas>
        )}

        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={[{
            fontFamily:    FontFamily.monoBold,
            fontSize:      sm ? FontSize.caption - 0.5 : FontSize.caption,
            letterSpacing: 0.26,
            textTransform: 'uppercase',
            color:         textColor,
          }, stamped, textStyle]}>
            {children}
          </Text>
        )}
      </AnimatedPressable>

      {/* Stardust + golden threads float above, free to drift past the plate */}
      {fissure && <FissureRelease f={fissure} t={crackT} fade={crackFade} />}
    </View>
  )
}

// ── Strike sparks (one path, built on the UI thread) ─────────────────────────
function Sparks({ t, at }: { t: SharedValue<number>; at: SharedValue<{ x: number; y: number }> }) {
  const path = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make()
    const v = t.value
    if (v > 0 && v < 1) {
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + i * 0.7
        const dist = (8 + (i % 4) * 7) * v
        const r = 1.3 * (1 - v)
        b.addCircle(at.value.x + Math.cos(ang) * dist, at.value.y + Math.sin(ang) * dist * 0.7 + 10 * v * v, r)
      }
    }
    return b.detach()
  })
  const opacity = useDerivedValue(() => (t.value > 0 && t.value < 1 ? 1 - t.value : 0))
  return (
    <Path path={path} color="#FFE9B8" opacity={opacity}>
      <BlurMask blur={1.2} style="solid" />
    </Path>
  )
}

// ── The crack itself: warm bloom · dark flanks · molten core ─────────────────
function FissureCrack({ f, t, fade }: { f: FissureState; t: SharedValue<number>; fade: SharedValue<number> }) {
  const spread = useDerivedValue(() => fissureSpread(t.value))
  const glow = useDerivedValue(() => fissureGlow(t.value))
  const bloomOp = useDerivedValue(() => Math.min(1, 0.55 * glow.value) * fade.value)
  const bloomW = useDerivedValue(() => 7 + 5 * Math.max(0, glow.value - 1))
  const midOp = useDerivedValue(() => Math.min(1, glow.value) * fade.value)
  const coreOp = useDerivedValue(() => Math.min(1, 0.4 + glow.value) * fade.value)
  const flankOp = useDerivedValue(() => 0.85 * fade.value)
  const flash = useDerivedValue(() => impactFlash(t.value) * fade.value)
  const clip = useMemo(() => {
    const b = Skia.PathBuilder.Make()
    b.addRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, f.w, f.h), PLATE_RADIUS, PLATE_RADIUS))
    return b.detach()
  }, [f.w, f.h])

  return (
    <Group clip={clip}>
      {f.arms.map((p, i) => (
        <Group key={`a${i}`}>
          <Path path={p} style="stroke" strokeWidth={bloomW} strokeCap="round" strokeJoin="round"
            color="rgb(255,176,70)" blendMode="screen" start={0} end={spread} opacity={bloomOp}>
            <BlurMask blur={4.5} style="normal" />
          </Path>
          <Path path={p} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round"
            color="rgb(48,24,2)" start={0} end={spread} opacity={flankOp}>
            <BlurMask blur={0.8} style="normal" />
          </Path>
          <Path path={p} style="stroke" strokeWidth={1.5} strokeCap="round" strokeJoin="round"
            color="rgb(255,205,120)" start={0} end={spread} opacity={midOp} />
          <Path path={p} style="stroke" strokeWidth={0.7} strokeCap="round" strokeJoin="round"
            color="rgb(255,252,238)" start={0} end={spread} opacity={coreOp} />
        </Group>
      ))}
      {f.branches.map((b, i) => <Branch key={`b${i}`} path={b.path} at={b.at} t={t} glow={glow} fade={fade} />)}
      <Circle cx={f.tap.x} cy={f.tap.y} r={6} color="rgb(255,245,210)" opacity={flash}>
        <BlurMask blur={5} style="normal" />
      </Circle>
    </Group>
  )
}

function Branch({ path, at, t, glow, fade }: {
  path: SkPath; at: number; t: SharedValue<number>; glow: SharedValue<number>; fade: SharedValue<number>
}) {
  const grow = useDerivedValue(() => Math.max(0, Math.min(1, (t.value - at) / 0.08)))
  const flankOp = useDerivedValue(() => (grow.value > 0 ? 0.8 : 0) * fade.value)
  const coreOp = useDerivedValue(() => (grow.value > 0 ? Math.min(1, glow.value) : 0) * fade.value)
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={1.8} strokeCap="round" color="rgb(48,24,2)" start={0} end={grow} opacity={flankOp}>
        <BlurMask blur={0.5} style="normal" />
      </Path>
      <Path path={path} style="stroke" strokeWidth={0.5} strokeCap="round" color="rgb(255,240,200)" start={0} end={grow} opacity={coreOp} />
    </Group>
  )
}

// ── Minute stardust + fine golden threads, above the plate ───────────────────
function FissureRelease({ f, t, fade }: { f: FissureState; t: SharedValue<number>; fade: SharedValue<number> }) {
  const M = OVERLAY_MARGIN
  const dust = f.dust
  const cores = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make()
    for (let i = 0; i < dust.length; i++) {
      const [x, y, a, r] = dustAt(dust[i], t.value)
      if (a > 0.04) b.addCircle(x + M, y + M, r * (0.6 + 0.4 * a))
    }
    return b.detach()
  })
  const halos = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make()
    for (let i = 0; i < dust.length; i++) {
      const [x, y, a, r] = dustAt(dust[i], t.value)
      if (a > 0.04) b.addCircle(x + M, y + M, r * 2.4 * a)
    }
    return b.detach()
  })
  return (
    <Canvas
      pointerEvents="none"
      style={{ position: 'absolute', left: -M, top: -M, width: f.w + 2 * M, height: f.h + 2 * M, zIndex: 50, elevation: 50 }}
    >
      <Group opacity={fade}>
        <Group transform={[{ translateX: M }, { translateY: M }]}>
          {f.threads.map((th, i) => <ThreadNode key={i} path={th.path} at={th.at} dx={th.dx} dy={th.dy} t={t} />)}
        </Group>
        <Path path={halos} color="rgba(255,200,110,0.55)">
          <BlurMask blur={1.4} style="normal" />
        </Path>
        <Path path={cores} color="rgb(255,248,225)" />
      </Group>
    </Canvas>
  )
}

function ThreadNode({ path, at, dx, dy, t }: { path: SkPath; at: number; dx: number; dy: number; t: SharedValue<number> }) {
  const end = useDerivedValue(() => threadAt(at, dx, dy, t.value)[0])
  const op = useDerivedValue(() => threadAt(at, dx, dy, t.value)[1])
  const glowOp = useDerivedValue(() => 0.45 * threadAt(at, dx, dy, t.value)[1])
  const transform = useDerivedValue(() => {
    const s = threadAt(at, dx, dy, t.value)
    return [{ translateX: s[2] }, { translateY: s[3] }]
  })
  return (
    <Group transform={transform}>
      <Path path={path} style="stroke" strokeWidth={2.2} strokeCap="round" color="rgb(255,200,100)" start={0} end={end} opacity={glowOp}>
        <BlurMask blur={1.6} style="normal" />
      </Path>
      <Path path={path} style="stroke" strokeWidth={0.4} strokeCap="round" color="rgb(255,238,190)" start={0} end={end} opacity={op} />
    </Group>
  )
}
