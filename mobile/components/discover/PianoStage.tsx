/**
 * The piano's stage page. Transparent — the piano itself lives in the fixed
 * 3D canvas behind and is framed to sit centred on this page. This page holds
 * the words around it, the sideways-swipe that turns the piano, and the door
 * into Discover Mode.
 */
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle, useSharedValue, interpolate, Extrapolation, withTiming, withDelay, type SharedValue,
} from 'react-native-reanimated'
import { Colors, FontFamily, Spacing } from '@/lib/tokens'
import GoldButton from '@/components/ui/GoldButton'
import { discoverState } from '@/components/experience/observatory/discoverState'

type Props = {
  height: number
  topInset: number
  bottomInset: number
  scrollY: SharedValue<number>
  stageTop: SharedValue<number>
  onEnterDiscoverMode: () => void
  /** Discover Mode is open on top: the words leave, the piano stays */
  hidden?: boolean
}

const MAX_TILT = 0.3   // rad — a piano shouldn't be flipped over

/** -1 one page below → 0 settled → +1 one page past */
function useStageLine(scrollY: SharedValue<number>, stageTop: SharedValue<number>, h: number, delay: number) {
  return useAnimatedStyle(() => {
    const p = (scrollY.value - stageTop.value) / h
    const enter = interpolate(p, [-0.6 + delay, -0.06 + delay * 0.5], [0, 1], Extrapolation.CLAMP)
    const exit = interpolate(p, [0.06, 0.36], [1, 0], Extrapolation.CLAMP)
    return { opacity: enter * exit, transform: [{ translateY: (1 - enter) * 24 - (1 - exit) * 30 }] }
  })
}

export default function PianoStage({ height, topInset, bottomInset, scrollY, stageTop, onEnterDiscoverMode, hidden = false }: Props) {
  // While the user plays with the piano the words step aside
  const dim = useSharedValue(1)
  const [turned, setTurned] = useState(false)

  const spin = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onStart(() => {
      discoverState.dragging = true
      discoverState.dragVelY = 0
      dim.value = withTiming(0.25, { duration: 220 })
      if (!turned) setTurned(true)
    })
    .onChange((e) => {
      discoverState.dragRotY += e.changeX * 0.012
      discoverState.dragRotX = Math.max(-MAX_TILT, Math.min(MAX_TILT, discoverState.dragRotX + e.changeY * 0.003))
    })
    .onFinalize((e) => {
      discoverState.dragging = false
      // Release inertia: the piano keeps turning and settles (rad/s)
      discoverState.dragVelY = Math.max(-6, Math.min(6, e.velocityX * 0.012))
      dim.value = withDelay(1400, withTiming(1, { duration: 450 }))
    })

  const head = useStageLine(scrollY, stageTop, height, 0)
  const sub = useStageLine(scrollY, stageTop, height, 0.06)
  const cta = useStageLine(scrollY, stageTop, height, 0.12)
  const present = useSharedValue(1)
  useEffect(() => {
    present.value = withTiming(hidden ? 0 : 1, { duration: hidden ? 250 : 600 })
  }, [hidden, present])
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value * present.value }))
  const hintStyle = useAnimatedStyle(() => ({ opacity: withTiming(turned ? 0 : 1, { duration: 500 }) }))

  const ctaBottom = bottomInset + 72 + Spacing.lg   // above the floating tab bar

  return (
    <GestureDetector gesture={spin}>
      <View style={{ height }} collapsable={false}>
        {/* Above the piano */}
        <Animated.View style={[{ position: 'absolute', top: topInset + height * 0.07, left: 0, right: 0, alignItems: 'center' }, dimStyle]}>
          <Animated.View style={head}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2.2, color: Colors.brassDim, textAlign: 'center', marginBottom: 10 }}>
              ── THE INSTRUMENT ──
            </Text>
            <Text style={{ fontFamily: FontFamily.serif, fontSize: 34, lineHeight: 39, color: Colors.offWhite, textAlign: 'center' }}>
              Every icon begins{'\n'}
              <Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>with a single note.</Text>
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Below the piano */}
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: ctaBottom, alignItems: 'center', paddingHorizontal: Spacing.lg }, dimStyle]}>
          <Animated.View style={[sub, { alignItems: 'center' }]}>
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }, hintStyle]}>
              <Text style={{ color: Colors.brass, fontSize: 12, opacity: 0.7 }}>⟲</Text>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>SWIPE TO TURN THE PIANO</Text>
            </Animated.View>
          </Animated.View>
          <Animated.View style={[cta, { alignItems: 'center' }]}>
            <GoldButton onPress={onEnterDiscoverMode} shimmer effect="crack">
              Enter Discover Mode ↗
            </GoldButton>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 10, letterSpacing: 0.3, color: 'rgba(255,255,255,0.38)', marginTop: 12, textAlign: 'center' }}>
              Tomorrow's icons, one card at a time.
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  )
}
