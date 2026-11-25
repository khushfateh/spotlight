/**
 * Genre crystals (photo tiles) and Discovery Lens chips — the Observatory's
 * two ways to narrow the field. Both toggle; selecting one switches the page
 * into results mode.
 */
import { ScrollView, View, Text } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, Spacing } from '@/lib/tokens'
import { GENRES, LENSES, type LensId } from '@/lib/data/discover'
import ArtistImage from './ArtistImage'
import PressScale from './PressScale'

const TILE_W = 118
const TILE_H = 76

export function GenreTiles({ active, onSelect }: { active: string | null; onSelect: (id: string | null) => void }) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0 }}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={TILE_W + 10}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 10 }}
    >
      {GENRES.map((g) => (
        <GenreTile key={g.id} id={g.id} label={g.label} glyph={g.glyph} uri={g.imageUrl} count={g.tickers.length}
          selected={active === g.id} dimmed={!!active && active !== g.id}
          onPress={() => onSelect(active === g.id ? null : g.id)} />
      ))}
    </ScrollView>
  )
}

function GenreTile({ id, label, glyph, uri, count, selected, dimmed, onPress }: {
  id: string; label: string; glyph: string; uri: string; count: number; selected: boolean; dimmed: boolean; onPress: () => void
}) {
  const ring = useAnimatedStyle(() => ({
    opacity: withTiming(selected ? 1 : 0, { duration: 220 }),
  }))
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(dimmed ? 0.45 : 1, { duration: 260 }),
  }))
  return (
    <PressScale onPress={onPress} accessibilityLabel={`${label} genre`}>
      <Animated.View style={[{ width: TILE_W, height: TILE_H, borderRadius: 4, overflow: 'hidden' }, fade]}>
        <ArtistImage uri={uri} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient
          colors={['rgba(5,5,8,0.05)', 'rgba(5,5,8,0.45)', 'rgba(5,5,8,0.94)']}
          locations={[0, 0.45, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: 'rgba(201,168,76,0.16)', borderRadius: 4 }} />
        <Animated.View
          pointerEvents="none"
          style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 4,
            borderWidth: 1.5, borderColor: Colors.brass, backgroundColor: 'rgba(201,168,76,0.12)',
          }, ring]}
        />
        <View style={{ position: 'absolute', left: 9, right: 9, bottom: 8 }}>
          <Text style={{ color: Colors.brassLight, fontSize: 10, marginBottom: 2 }}>{glyph}</Text>
          <Text numberOfLines={1} style={{ fontFamily: FontFamily.monoBold, fontSize: 10, letterSpacing: 1.1, color: '#fff', textTransform: 'uppercase' }}>
            {label}
          </Text>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 0.8, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            {count} {count === 1 ? 'ARTIST' : 'ARTISTS'}
          </Text>
        </View>
        {selected && (
          <View key={id} style={{ position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.brass, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, color: '#1a1103', fontFamily: FontFamily.monoBold }}>✓</Text>
          </View>
        )}
      </Animated.View>
    </PressScale>
  )
}

export function LensChips({ active, onSelect }: { active: LensId | null; onSelect: (id: LensId | null) => void }) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0 }}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8 }}
    >
      {LENSES.map((l) => {
        const on = active === l.id
        return (
          <PressScale key={l.id} onPress={() => onSelect(on ? null : l.id)} depth={0.92} accessibilityLabel={l.label}>
            <View style={{
              height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6,
              borderWidth: 1,
              borderColor: on ? l.color : 'rgba(255,255,255,0.10)',
              backgroundColor: on ? `${l.color}22` : 'rgba(9,7,14,0.66)',
            }}>
              <Text style={{ fontSize: 10, color: on ? l.color : 'rgba(255,255,255,0.4)' }}>{l.glyph}</Text>
              <Text style={{
                fontFamily: FontFamily.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
                color: on ? l.color : 'rgba(255,255,255,0.55)',
              }}>
                {l.label}
              </Text>
            </View>
          </PressScale>
        )
      })}
    </ScrollView>
  )
}
