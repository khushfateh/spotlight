import { Pressable, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/lib/tokens'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Variant = 'primary' | 'outline' | 'ghost'

type Props = {
  children:  React.ReactNode
  onPress:   () => void
  variant?:  Variant
  loading?:  boolean
  disabled?: boolean
  style?:    ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
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
}: Props) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
    variant === 'primary' ? '#0a0806' :
    variant === 'outline' ? Colors.brass :
    Colors.brassDim

  const border =
    variant === 'outline' ? { borderWidth: 1, borderColor: Colors.glassFocus } :
    {}

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 20, stiffness: 400 }) }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 20, stiffness: 400 }) }}
      style={[animStyle, {
        backgroundColor: bgColor,
        borderRadius:    Radius.sharp,
        paddingVertical:   Spacing.sm + 4,
        paddingHorizontal: Spacing.lg,
        alignItems:      'center',
        justifyContent:  'center',
        flexDirection:   'row',
        gap:             8,
        opacity:         disabled ? 0.4 : 1,
        width:           fullWidth ? '100%' : undefined,
        ...border,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[{
          fontFamily:    FontFamily.mono,
          fontSize:      FontSize.caption,
          letterSpacing: 0.22,
          textTransform: 'uppercase',
          fontWeight:    '500',
          color:         textColor,
        }, textStyle]}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  )
}
