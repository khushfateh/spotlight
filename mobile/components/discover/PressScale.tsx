/**
 * PressScale — the tactile wrapper used by every Discover card: a quick
 * spring-down on touch, a light haptic, spring back on release.
 */
import { Pressable, Platform, type ViewStyle, type StyleProp } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Props = {
  children: React.ReactNode
  onPress: () => void
  style?: StyleProp<ViewStyle>
  /** how far it presses in (default 0.965) */
  depth?: number
  haptic?: boolean
  accessibilityLabel?: string
}

export default function PressScale({ children, onPress, style, depth = 0.965, haptic = true, accessibilityLabel }: Props) {
  const scale = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => { scale.value = withSpring(depth, { damping: 18, stiffness: 520 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 320 }) }}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  )
}
