import { View, Pressable, Text, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
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
  const scale = useSharedValue(1)
  const icon  = ICONS[route.name] ?? { active: '●', inactive: '○' }
  const label = LABELS[route.name] ?? route.name

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 })
    })
    Haptics.selectionAsync()
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[animStyle, { alignItems: 'center', gap: 4 }]}>
        <Text style={{
          fontSize: isFocused ? 20 : 18,
          color:    isFocused ? Colors.brass : 'rgba(255,255,255,0.28)',
          lineHeight: 24,
        }}>
          {isFocused ? icon.active : icon.inactive}
        </Text>
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      7,
          letterSpacing: 0.18,
          textTransform: 'uppercase',
          color:         isFocused ? Colors.brass : 'rgba(255,255,255,0.28)',
        }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{
      position:        'absolute',
      bottom:          0,
      left:            0,
      right:           0,
      paddingBottom:   insets.bottom,
    }}>
      <BlurView
        intensity={32}
        tint="dark"
        style={{
          backgroundColor:  'rgba(5,5,8,0.88)',
          borderTopWidth:   1,
          borderTopColor:   Colors.glassBorder,
          flexDirection:    'row',
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
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          )
        })}
      </BlurView>
    </View>
  )
}
