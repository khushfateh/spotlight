import { useRef, useState } from 'react'
import {
  View, TextInput, Text, Pressable,
  type TextInputProps, type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/lib/tokens'

type Props = TextInputProps & {
  label?:       string
  icon?:        string
  onClear?:     () => void
  style?:       ViewStyle
  inputStyle?:  object
}

export default function PremiumInput({
  label,
  icon,
  value,
  onClear,
  style,
  inputStyle,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<any>(null)
  const borderAnim = useSharedValue(0)

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(201,168,76,${0.14 + borderAnim.value * 0.42})`,
    shadowOpacity: borderAnim.value * 0.18,
  }))

  const onFocus = () => {
    setFocused(true)
    borderAnim.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
    props.onFocus?.({} as any)
  }

  const onBlur = () => {
    setFocused(false)
    borderAnim.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })
    props.onBlur?.({} as any)
  }

  return (
    <View style={style}>
      {label && (
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      FontSize.label,
          color:         focused ? Colors.brassDim : 'rgba(255,255,255,0.28)',
          letterSpacing: 0.28,
          textTransform: 'uppercase',
          marginBottom:  7,
        }}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[borderStyle, {
          flexDirection:  'row',
          alignItems:     'center',
          backgroundColor:'rgba(7,5,13,0.72)',
          borderWidth:    1,
          borderRadius:   Radius.sharp,
          paddingHorizontal: Spacing.md,
          paddingVertical:   Spacing.sm + 3,
          gap:            Spacing.sm,
          shadowColor:    Colors.brass,
          shadowOffset:   { width: 0, height: 0 },
          shadowRadius:   8,
        }]}
      >
        {icon && (
          <Text style={{ color: Colors.brassDim, fontSize: 14, flexShrink: 0 }}>
            {icon}
          </Text>
        )}
        <TextInput
          ref={ref}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor="rgba(255,255,255,0.22)"
          style={[{
            flex:         1,
            fontFamily:   FontFamily.mono,
            fontSize:     FontSize.caption,
            color:        Colors.offWhite,
            letterSpacing:0.02,
            padding:      0,
          }, inputStyle]}
          {...props}
        />
        {value && value.toString().length > 0 && onClear && (
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={{ color: 'rgba(255,255,255,0.28)', fontSize: 16, lineHeight: 18 }}>×</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  )
}
