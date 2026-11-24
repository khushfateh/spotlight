import { useEffect, useRef } from 'react'
import {
  Pressable, Text, ActivityIndicator, View,
  type ViewStyle, type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '@/lib/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'outline' | 'ghost'

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
}

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
}: Props) {
  const scale       = useSharedValue(1)
  const shimmerX    = useSharedValue(-1)
  const shimmerOn   = shimmer && variant === 'primary'

  useEffect(() => {
    if (!shimmerOn) return
    const loop = () => {
      shimmerX.value = withDelay(
        2800,
        withTiming(2, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      )
    }
    shimmerX.value = -1
    loop()
    const id = setInterval(loop, 3600)
    return () => clearInterval(id)
  }, [shimmerOn])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 200 }],
    opacity: Math.max(0, 1 - Math.abs(shimmerX.value - 0.5) * 2.4),
  }))

  const handlePress = () => {
    if (disabled || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const bgColor =
    variant === 'primary' ? Colors.brass :
    variant === 'outline' ? 'transparent' :
    'transparent'

  const textColor =
    variant === 'primary' ? '#080604' :
    variant === 'outline' ? Colors.brass :
    Colors.brassDim

  const borderColor =
    variant === 'outline' ? Colors.glassFocus :
    variant === 'primary' ? 'rgba(255,220,100,0.3)' :
    'transparent'

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.955, { damping: 22, stiffness: 500 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 })
      }}
      style={[containerStyle, {
        backgroundColor: bgColor,
        borderRadius:    Radius.sharp,
        paddingVertical:   Spacing.sm + 5,
        paddingHorizontal: Spacing.lg + 4,
        alignItems:      'center',
        justifyContent:  'center',
        flexDirection:   'row',
        gap:             8,
        opacity:         disabled ? 0.38 : 1,
        width:           fullWidth ? '100%' : undefined,
        borderWidth:     variant !== 'ghost' ? 1 : 0,
        borderColor,
        overflow:        'hidden',
        ...(variant === 'primary' ? {
          shadowColor:   Colors.brass,
          shadowOffset:  { width: 0, height: 2 },
          shadowOpacity: 0.28,
          shadowRadius:  10,
          elevation:     6,
        } : {}),
      }, style]}
    >
      {/* Shimmer sweep for primary buttons */}
      {shimmerOn && !loading && (
        <Animated.View
          style={[shimmerStyle, {
            position: 'absolute',
            top: 0, bottom: 0,
            width: 100,
            backgroundColor: 'rgba(255,255,255,0.14)',
            transform: [{ skewX: '-18deg' }],
          }]}
          pointerEvents="none"
        />
      )}

      {/* Inner gradient on primary */}
      {variant === 'primary' && !loading && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '50%', borderRadius: Radius.sharp,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }} pointerEvents="none" />
      )}

      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[{
          fontFamily:    FontFamily.monoBold,
          fontSize:      FontSize.caption,
          letterSpacing: 0.26,
          textTransform: 'uppercase',
          color:         textColor,
        }, textStyle]}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  )
}
