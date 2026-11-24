import { useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import MonoLabel from './MonoLabel'
import ScoreBar from './ScoreBar'

type Props = {
  rank:     number
  name:     string
  ticker:   string
  score:    number
  delta?:   number
  onPress:  () => void
  delay?:   number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function ArtistRow({ rank, name, ticker, score, delta, onPress, delay = 0 }: Props) {
  const scale   = useSharedValue(1)
  const enterY  = useSharedValue(16)
  const enterOp = useSharedValue(0)

  useEffect(() => {
    enterY.value  = withDelay(delay, withTiming(0,  { duration: 500, easing: Easing.out(Easing.cubic) }))
    enterOp.value = withDelay(delay, withTiming(1,  { duration: 420, easing: Easing.out(Easing.cubic) }))
  }, [delay])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: enterY.value },
      { scale: scale.value },
    ],
    opacity: enterOp.value,
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const scoreColor = score >= 90 ? Colors.brass
    : score >= 80 ? Colors.brassLight
    : Colors.dimWhite

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }) }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 18, stiffness: 320 }) }}
      style={[containerStyle, {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(201,168,76,0.07)',
      }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Rank */}
        <MonoLabel
          size="caption"
          color="rgba(255,255,255,0.18)"
          style={{ width: 28, flexShrink: 0 }}
        >
          {String(rank).padStart(2, '0')}
        </MonoLabel>

        {/* Avatar */}
        <View style={{
          width: 44, height: 44, borderRadius: 22, flexShrink: 0,
          backgroundColor: 'rgba(201,168,76,0.07)',
          borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)',
          alignItems: 'center', justifyContent: 'center',
          marginRight: Spacing.md,
          shadowColor: Colors.brass,
          shadowOpacity: 0.2, shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        }}>
          <Text style={{ color: Colors.brass, fontSize: 15 }}>◈</Text>
        </View>

        {/* Name + ticker + score bar */}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: FontFamily.serif,
                fontSize: FontSize.bodyLg,
                color: Colors.offWhite,
                letterSpacing: 0.01,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginLeft: 8 }}>
              <Text style={{
                fontFamily: FontFamily.monoBold,
                fontSize: FontSize.bodyLg,
                color: scoreColor,
                letterSpacing: -0.3,
              }}>
                {score}
              </Text>
              {delta !== undefined && delta > 0 && (
                <MonoLabel size="label" color={Colors.success}>
                  +{delta}
                </MonoLabel>
              )}
            </View>
          </View>

          {/* Ticker + Score bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MonoLabel
              size="label"
              color="rgba(255,255,255,0.22)"
              style={{ flexShrink: 0 }}
            >
              {ticker}
            </MonoLabel>
            <ScoreBar
              score={score}
              color={scoreColor}
              height={1.5}
              delay={delay + 200}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Arrow */}
        <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16, marginLeft: Spacing.sm }}>›</Text>
      </View>
    </AnimatedPressable>
  )
}
