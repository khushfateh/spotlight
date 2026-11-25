/**
 * The Observatory's crystal search: a glass field with a brass hairline that
 * glows on focus, and a placeholder that quietly cycles through suggestions.
 */
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { View, TextInput, Text, Pressable } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, FadeInDown, FadeOutUp,
} from 'react-native-reanimated'
import { Colors, FontFamily } from '@/lib/tokens'

const HINTS = [
  'Search artists, genres, cities…',
  'Try “Hanumankind”',
  'Try “Punjabi”',
  'Try “Seoul”',
  'Try “Hip-Hop”',
]

type Props = {
  value: string
  onChangeText: (v: string) => void
  onFocusChange?: (focused: boolean) => void
}

export default function SearchField({ value, onChangeText, onFocusChange }: Props) {
  const [focused, setFocused] = useState(false)
  const [hint, setHint] = useState(0)
  const ref = useRef<ComponentRef<typeof TextInput>>(null)
  const glow = useSharedValue(0)

  // Cycle the suggestion while the field is idle and empty
  useEffect(() => {
    if (focused || value) return
    const id = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 3200)
    return () => clearInterval(id)
  }, [focused, value])

  const frame = useAnimatedStyle(() => ({
    borderColor: `rgba(201,168,76,${0.16 + glow.value * 0.4})`,
    shadowOpacity: glow.value * 0.32,
    backgroundColor: `rgba(9,7,14,${0.72 + glow.value * 0.14})`,
  }))

  const setFocus = (f: boolean) => {
    setFocused(f)
    glow.value = withTiming(f ? 1 : 0, { duration: f ? 240 : 320, easing: Easing.out(Easing.cubic) })
    onFocusChange?.(f)
  }

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityRole="search">
      <Animated.View
        style={[{
          height: 50,
          borderWidth: 1,
          borderRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 10,
          shadowColor: Colors.brass,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 14,
        }, frame]}
      >
        <Text style={{ color: Colors.brass, fontSize: 17, opacity: 0.85, marginTop: -2 }}>⌕</Text>
        <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
          {!value && (
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0 }}>
              <Animated.Text
                key={focused ? 'focused' : hint}
                entering={FadeInDown.duration(380)}
                exiting={FadeOutUp.duration(260)}
                numberOfLines={1}
                style={{ fontFamily: FontFamily.mono, fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 }}
              >
                {focused ? 'Artist, genre, city or ticker' : HINTS[hint]}
              </Animated.Text>
            </View>
          )}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={Colors.brass}
            keyboardAppearance="dark"
            style={{ fontFamily: FontFamily.mono, fontSize: 13, color: Colors.offWhite, letterSpacing: 0.3, padding: 0, height: '100%' }}
          />
        </View>
        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={10}
            accessibilityLabel="Clear search"
            style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 15 }}>×</Text>
          </Pressable>
        )}
      </Animated.View>
    </Pressable>
  )
}
