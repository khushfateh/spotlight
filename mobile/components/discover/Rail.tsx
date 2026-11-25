/**
 * An editorial rail: eyebrow + serif title + one-line description, then a
 * horizontally snapping row of cards. A soft haptic tick marks each card
 * settling under the thumb; "See all" opens the matching lens.
 */
import { useRef } from 'react'
import { View, Text, ScrollView, Platform, Pressable, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, Spacing } from '@/lib/tokens'

type Props = {
  glyph: string
  eyebrow: string
  color: string
  title: string
  accent: string
  description: string
  itemWidth: number
  onSeeAll?: () => void
  children: React.ReactNode
}

export function SectionHeader({ glyph, eyebrow, color, title, accent, description, onSeeAll }: Omit<Props, 'itemWidth' | 'children'>) {
  return (
    <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={{ color, fontSize: 10 }}>{glyph}</Text>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.6, color, textTransform: 'uppercase' }}>{eyebrow}</Text>
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={10} accessibilityRole="button" accessibilityLabel={`See all ${eyebrow}`}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)' }}>SEE ALL →</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ fontFamily: FontFamily.serif, fontSize: 28, lineHeight: 33, color: Colors.offWhite, marginTop: 6 }}>
        {title} <Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>{accent}</Text>
      </Text>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 10, letterSpacing: 0.3, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>
        {description}
      </Text>
    </View>
  )
}

export default function Rail({ itemWidth, children, ...header }: Props) {
  const gap = 12
  const last = useRef(0)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (itemWidth + gap))
    if (i !== last.current) {
      last.current = i
      if (Platform.OS !== 'web') Haptics.selectionAsync()
    }
  }
  return (
    <View>
      <SectionHeader {...header} />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + gap}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap }}
      >
        {children}
      </ScrollView>
    </View>
  )
}
