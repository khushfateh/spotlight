import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Platform, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import PianoCanvas from '@/components/experience/PianoCanvas'
import MonoLabel from '@/components/ui/MonoLabel'
import ArtistRow from '@/components/ui/ArtistRow'
import GoldButton from '@/components/ui/GoldButton'
import PremiumInput from '@/components/ui/PremiumInput'
import GoldDivider from '@/components/ui/GoldDivider'
import RequestArtistModal from '@/components/sheets/RequestArtistModal'
import { useMomentum } from '@/context/MomentumContext'
import { CREATORS } from '@/lib/data/creators'
import { logCreatorSearch } from '@/lib/services/signalService'
import { useAuth } from '@/context/AuthContext'

const LENSES = [
  { id: 'trending',  label: 'Trending',      color: '#fb923c' },
  { id: 'rising',    label: 'Rising Fast',   color: '#34d399' },
  { id: 'breakout',  label: 'Near Breakout', color: Colors.brass },
  { id: 'gems',      label: 'Hidden Gems',   color: '#60a5fa' },
  { id: 'editors',   label: "Editor's Picks",color: '#a78bfa' },
]

function LensChip({
  lens, active, onPress,
}: { lens: typeof LENSES[0]; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1)

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 500 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 350 })
    })
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={chipStyle}>
      <Pressable
        onPress={handlePress}
        style={{
          paddingVertical:   5,
          paddingHorizontal: 12,
          borderRadius:      Radius.sharp,
          borderWidth:       1,
          borderColor:       active ? lens.color : 'rgba(255,255,255,0.09)',
          backgroundColor:   active ? `${lens.color}1a` : 'rgba(7,5,13,0.60)',
        }}
      >
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      9,
          letterSpacing: 0.08,
          textTransform: 'uppercase',
          color:         active ? lens.color : 'rgba(255,255,255,0.32)',
          textShadowColor:  active ? lens.color : 'transparent',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: active ? 6 : 0,
        }}>
          {lens.label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

export default function DiscoverScreen() {
  const insets    = useSafeAreaInsets()
  const router    = useRouter()
  const { user }  = useAuth()
  const { getScore } = useMomentum()
  const [query,          setQuery]          = useState('')
  const [activeLens,     setActiveLens]     = useState<string | null>(null)
  const [requestVisible, setRequestVisible] = useState(false)
  const [requestQuery,   setRequestQuery]   = useState('')

  // Build discover feed with live scores
  const ALL_ARTISTS = Object.entries(CREATORS).map(([ticker, c]) => {
    const { score, delta } = getScore(ticker)
    return { ticker, name: c.name, genre: c.genre, score, delta }
  }).sort((a, b) => b.score - a.score)

  const filtered = ALL_ARTISTS.filter(a => {
    if (!query) return true
    const q = query.toLowerCase()
    return a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q)
  })

  const openRequest = (q = '') => {
    setRequestQuery(q)
    setRequestVisible(true)
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* Piano canvas — ambient bottom decoration */}
      <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, zIndex: 0 }} pointerEvents="none">
        <PianoCanvas />
      </View>

      {/* Content */}
      <View style={{ flex: 1, zIndex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + Spacing.md,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.sm,
        }}>
          <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 7, letterSpacing: 0.5 }}>
            ◆ The Observatory · Cultural Discovery
          </MonoLabel>
          <Text style={{
            fontFamily:    FontFamily.serif,
            fontSize:      FontSize.heading,
            color:         Colors.offWhite,
            letterSpacing: 0.01,
            marginBottom:  4,
          }}>
            Who's{' '}
            <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>
              next?
            </Text>
          </Text>
          <Text style={{
            fontFamily:    FontFamily.mono,
            fontSize:      FontSize.caption,
            color:         'rgba(255,255,255,0.32)',
            letterSpacing: 0.03,
          }}>
            Discover tomorrow's cultural icons before the world does.
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
          <PremiumInput
            icon="⌕"
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            placeholder="Search creators, genres, tickers..."
          />
          {/* Request nudge — appears when no results */}
          {query.length > 1 && filtered.length === 0 && (
            <Pressable
              style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => openRequest(query)}
            >
              <Text style={{ color: 'rgba(201,168,76,0.4)', fontSize: 12 }}>◇</Text>
              <MonoLabel size="label" color={Colors.brass}>
                Can't find "{query}"? Request them →
              </MonoLabel>
            </Pressable>
          )}
        </View>

        {/* Lens chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            gap: Spacing.sm,
            paddingBottom: Spacing.sm,
          }}
        >
          {LENSES.map(lens => (
            <LensChip
              key={lens.id}
              lens={lens}
              active={activeLens === lens.id}
              onPress={() => setActiveLens(activeLens === lens.id ? null : lens.id)}
            />
          ))}
        </ScrollView>

        <GoldDivider style={{ marginHorizontal: Spacing.lg, marginBottom: 0 }} />

        {/* Artist list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={{ paddingTop: Spacing.section, alignItems: 'center', gap: Spacing.md }}>
              <Text style={{
                fontFamily: FontFamily.serif,
                fontSize:   FontSize.title,
                color:      'rgba(255,255,255,0.28)',
                marginBottom: 4,
                textAlign: 'center',
              }}>
                No results for "{query}"
              </Text>
              <GoldButton onPress={() => openRequest(query)} shimmer>
                Request this artist →
              </GoldButton>
              <GoldButton onPress={() => setQuery('')} variant="outline">
                Clear search
              </GoldButton>
            </View>
          ) : (
            filtered.map((artist, i) => (
              <ArtistRow
                key={artist.ticker}
                rank={i + 1}
                name={artist.name}
                ticker={artist.ticker}
                score={artist.score}
                delta={artist.delta}
                onPress={() => {
                  if (query) logCreatorSearch(artist.ticker, query, user?.id)
                  router.push(`/creator/${artist.ticker}`)
                }}
                delay={i * 40}
              />
            ))
          )}

          {/* Request CTA at bottom */}
          {filtered.length > 0 && (
            <Pressable
              onPress={() => openRequest('')}
              style={{
                marginTop: Spacing.xl,
                paddingVertical: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderTopWidth: 1,
                borderTopColor: 'rgba(201,168,76,0.07)',
              }}
            >
              <Text style={{ color: 'rgba(201,168,76,0.3)', fontSize: 14 }}>◇</Text>
              <MonoLabel size="label" color={Colors.brassDim}>
                Don't see your artist? Request them →
              </MonoLabel>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Request Artist Modal */}
      <RequestArtistModal
        visible={requestVisible}
        onClose={() => setRequestVisible(false)}
        initialQuery={requestQuery}
      />
    </View>
  )
}
