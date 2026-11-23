// Discover — Phase 0 shell. Phase 1 adds the R3F piano scene behind this.

import { useState } from 'react'
import { View, TextInput, ScrollView, Pressable, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GlassCard from '@/components/ui/GlassCard'
import GoldButton from '@/components/ui/GoldButton'

const LENSES = [
  { id: 'trending',  label: 'Trending',      color: '#fb923c' },
  { id: 'rising',    label: 'Rising Fast',   color: '#34d399' },
  { id: 'breakout',  label: 'Near Breakout', color: Colors.brass },
  { id: 'gems',      label: 'Hidden Gems',   color: '#60a5fa' },
  { id: 'editors',   label: "Editor's Picks",color: '#a78bfa' },
]

const MOCK_ARTISTS = [
  { name: 'AP Dhillon',       ticker: 'APDHILLON',   score: 94, delta: 12 },
  { name: 'Karan Aujla',      ticker: 'KARANAUJLA',  score: 91, delta: 9  },
  { name: 'Hanumankind',      ticker: 'HANUMANKIND', score: 88, delta: 15 },
  { name: 'Sabrina Carpenter',ticker: 'SABRINAC',    score: 87, delta: 7  },
  { name: 'Doja Cat',         ticker: 'DOJACAT',     score: 85, delta: 4  },
  { name: 'Tyler the Creator',ticker: 'TYLERTC',     score: 83, delta: 6  },
  { name: 'Ice Spice',        ticker: 'ICESPICE',    score: 80, delta: 11 },
  { name: 'Peso Pluma',       ticker: 'PESOPLUMA',   score: 79, delta: 8  },
]

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [query,       setQuery]       = useState('')
  const [activeLens,  setActiveLens]  = useState<string | null>(null)

  const filtered = query
    ? MOCK_ARTISTS.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : MOCK_ARTISTS

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* Phase 1: Piano R3F canvas behind this — fixed, z:-1 */}

      {/* Header */}
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 8 }}>
          ◆ The Observatory · Cultural Discovery
        </MonoLabel>
        <SerifHeading size="heading" style={{ marginBottom: 4 }}>
          Who&apos;s{' '}
          <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>next?</Text>
        </SerifHeading>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.36)', letterSpacing: 0.02 }}>
          Discover tomorrow&apos;s cultural icons before the world does.
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(7,5,13,0.72)',
          borderWidth: 1, borderColor: query ? Colors.glassFocus : Colors.glassBorder,
          borderRadius: Radius.sharp,
          paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
          gap: Spacing.sm,
        }}>
          <Text style={{ color: Colors.brassDim, fontSize: 14 }}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search creators, genres, tickers..."
            placeholderTextColor="rgba(255,255,255,0.22)"
            style={{
              flex: 1,
              fontFamily: FontFamily.mono, fontSize: FontSize.caption,
              color: Colors.offWhite, letterSpacing: 0.02,
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>×</Text>
            </Pressable>
          )}
        </View>
        {/* Request nudge */}
        {query.length > 2 && filtered.length === 0 && (
          <Pressable style={{ marginTop: 8 }}>
            <MonoLabel size="label" color={Colors.brass}>
              Can&apos;t find "{query}"? Request them →
            </MonoLabel>
          </Pressable>
        )}
      </View>

      {/* Lens chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm }}
      >
        {LENSES.map(lens => {
          const active = activeLens === lens.id
          return (
            <Pressable
              key={lens.id}
              onPress={() => setActiveLens(active ? null : lens.id)}
              style={{
                paddingVertical: 5, paddingHorizontal: 12,
                borderRadius: Radius.sharp,
                borderWidth: 1,
                borderColor: active ? lens.color : 'rgba(255,255,255,0.10)',
                backgroundColor: active ? `${lens.color}22` : 'rgba(7,5,13,0.50)',
              }}
            >
              <Text style={{
                fontFamily: FontFamily.mono, fontSize: 10,
                fontWeight: '600', letterSpacing: 0.04,
                textTransform: 'uppercase',
                color: active ? lens.color : 'rgba(255,255,255,0.38)',
              }}>
                {lens.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Artist list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((artist, i) => (
          <Pressable
            key={artist.ticker}
            onPress={() => router.push(`/creator/${artist.ticker}`)}
            style={{ marginBottom: Spacing.sm }}
          >
            <GlassCard goldBorder style={{ padding: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <MonoLabel size="label" color="rgba(255,255,255,0.20)" style={{ width: 20 }}>
                    {String(i + 1).padStart(2, '0')}
                  </MonoLabel>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: 'rgba(201,168,76,0.08)',
                    borderWidth: 1, borderColor: Colors.glassBorder,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: Colors.brass, fontSize: 14 }}>◈</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.body, color: Colors.offWhite }}>
                      {artist.name}
                    </Text>
                    <MonoLabel size="label" color="rgba(255,255,255,0.28)">{artist.ticker}</MonoLabel>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.body, color: Colors.offWhite, fontWeight: '700' }}>
                    {artist.score}
                  </Text>
                  <MonoLabel size="label" color={Colors.success}>+{artist.delta} pts</MonoLabel>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
