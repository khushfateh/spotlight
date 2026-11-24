import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Colors, Spacing } from '@/lib/tokens'

function Bone({ w, h, delay = 0 }: { w: number | string; h: number; delay?: number }) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.08, { duration: 700 }),
        withTiming(0.3,  { duration: 700 }),
      ),
      -1,
      false,
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[style, {
        width:           w as any,
        height:          h,
        borderRadius:    2,
        backgroundColor: Colors.brass,
      }]}
    />
  )
}

export default function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <View style={{
      flexDirection:    'row',
      alignItems:       'center',
      paddingVertical:  Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(201,168,76,0.07)',
    }}>
      {/* Rank stub */}
      <Bone w={18} h={8} />
      {/* Avatar circle */}
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(201,168,76,0.05)',
        marginHorizontal: Spacing.md,
      }} />
      {/* Text block */}
      <View style={{ flex: 1, gap: 7 }}>
        <Bone w="62%" h={10} />
        <Bone w="38%" h={6}  />
      </View>
      {/* Score stub */}
      <Bone w={22} h={14} />
    </View>
  )
}
