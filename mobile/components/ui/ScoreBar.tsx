import { useEffect } from 'react'
import { View, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Colors } from '@/lib/tokens'

type Props = {
  score:    number  // 0–100
  color?:   string
  height?:  number
  delay?:   number
  style?:   ViewStyle
}

export default function ScoreBar({
  score,
  color   = Colors.brass,
  height  = 2,
  delay   = 0,
  style,
}: Props) {
  const width = useSharedValue(0)

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(score, { duration: 900, easing: Easing.out(Easing.cubic) }),
    )
  }, [score, delay])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View
      style={[{
        height,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        overflow: 'hidden',
      }, style]}
    >
      <Animated.View
        style={[fillStyle, {
          height: '100%',
          backgroundColor: color,
          borderRadius: 1,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }]}
      />
    </View>
  )
}
