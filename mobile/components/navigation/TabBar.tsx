import { View, Pressable, Text, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Colors, FontFamily, FontSize } from '@/lib/tokens'

const ICONS: Record<string, { active: string; inactive: string }> = {
  index:    { active: '◈', inactive: '◇' },
  discover: { active: '◉', inactive: '○' },
  vault:    { active: '▣', inactive: '▢' },
  profile:  { active: '◆', inactive: '◇' },
}

const LABELS: Record<string, string> = {
  index:    'Home',
  discover: 'Discover',
  vault:    'Vault',
  profile:  'Profile',
}

function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route:       { name: string; key: string }
  isFocused:   boolean
  onPress:     () => void
  onLongPress: () => void
}) {
  const scale       = useSharedValue(1)
  const dotOpacity  = useSharedValue(isFocused ? 1 : 0)
  const icon        = ICONS[route.name] ?? { active: '●', inactive: '○' }
  const label       = LABELS[route.name] ?? route.name

  // Sync dot opacity when focus changes
  if (isFocused && dotOpacity.value !== 1) {
    dotOpacity.value = withSpring(1, { damping: 18, stiffness: 400 })
  } else if (!isFocused && dotOpacity.value !== 0) {
    dotOpacity.value = withSpring(0, { damping: 18, stiffness: 400 })
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scaleX: interpolate(dotOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP) }],
  }))

  const handlePress = () => {
    scale.value = withSpring(0.82, { damping: 12, stiffness: 500 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 })
    })
    if (Platform.OS !== 'web') Haptics.selectionAsync()
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingTop: 12 }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[iconStyle, { alignItems: 'center', gap: 4 }]}>
        {/* Icon */}
        <Text style={{
          fontSize:   isFocused ? 20 : 17,
          color:      isFocused ? Colors.brass : 'rgba(255,255,255,0.22)',
          lineHeight: 24,
          textShadowColor: isFocused ? 'rgba(201,168,76,0.5)' : 'transparent',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isFocused ? 8 : 0,
        }}>
          {isFocused ? icon.active : icon.inactive}
        </Text>

        {/* Label */}
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      7,
          letterSpacing: 0.22,
          textTransform: 'uppercase',
          color:         isFocused ? Colors.brass : 'rgba(255,255,255,0.22)',
        }}>
          {label}
        </Text>

        {/* Active indicator dot */}
        <Animated.View style={[dotStyle, {
          width:        20,
          height:       1.5,
          borderRadius: 1,
          backgroundColor: Colors.brass,
          marginTop:    1,
          shadowColor:  Colors.brass,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 4,
        }]} />
      </Animated.View>
    </Pressable>
  )
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{
      position:  'absolute',
      bottom:    0,
      left:      0,
      right:     0,
      paddingBottom: insets.bottom,
    }}>
      {/* Top separator line */}
      <View style={{
        height: 1,
        backgroundColor: 'rgba(201,168,76,0.10)',
      }} />
      <BlurView
        intensity={40}
        tint="dark"
        style={{
          backgroundColor: 'rgba(5,5,8,0.92)',
          flexDirection:   'row',
        }}
      >
        {state.routes.map((route: { name: string; key: string }, index: number) => {
          const isFocused = state.index === index
          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name)
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          )
        })}
      </BlurView>
    </View>
  )
}
