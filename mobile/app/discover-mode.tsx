/**
 * Discover Mode — swipe through tomorrow's icons, one card at a time.
 *
 * Presented as a transparent modal over the Discover tab: the Observatory's
 * threads and star dust keep moving behind the cards (the scene is kept alive
 * while this screen is open).
 *
 *   right → Spot (a real spot when signed in; saved here otherwise)
 *   left  → Pass · tap → artist profile
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, Dimensions, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeIn, FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming, Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, Spacing } from '@/lib/tokens'
import GoldButton from '@/components/ui/GoldButton'
import SwipeDeck, { type DeckHandle, type Decision } from '@/components/discover/SwipeDeck'
import ArtistImage from '@/components/discover/ArtistImage'
import { setSceneKeepAlive } from '@/components/experience/observatory/discoverState'
import { useMomentum } from '@/context/MomentumContext'
import { useAuth } from '@/context/AuthContext'
import { useSpots } from '@/lib/hooks/useSpots'
import { buildArtists, discoverDeck, fmtCount, type Artist } from '@/lib/data/discover'

const { width: W, height: H } = Dimensions.get('window')
const HEADER_H = 92
const ACTIONS_H = 118

type Toast = { id: number; text: string }

export default function DiscoverModeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { getScore } = useMomentum()
  const { spottedTickers, spot } = useSpots()

  // Keep the Observatory moving behind us
  useEffect(() => {
    setSceneKeepAlive(true)
    return () => setSceneKeepAlive(false)
  }, [])

  // Freeze the deck for this session (live score updates won't reshuffle it)
  const deck = useMemo(() => discoverDeck(buildArtists(getScore)), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { deck.forEach((a) => { Image.prefetch(a.imageUrl).catch(() => {}) }) }, [deck])
  const alreadySpotted = useMemo(() => new Set(spottedTickers), [spottedTickers])

  const [deckKey, setDeckKey] = useState(0)
  const [seen, setSeen] = useState(0)
  const [kept, setKept] = useState<Artist[]>([])
  const deckRef = useRef<DeckHandle>(null)
  const done = seen >= deck.length

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text })
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])
  const nudged = useRef(false)

  const onDecision = useCallback((a: Artist, d: Decision) => {
    setSeen((n) => n + 1)
    if (d !== 'spot') return
    setKept((k) => (k.some((x) => x.ticker === a.ticker) ? k : [...k, a]))
    if (!isAuthenticated) {
      if (!nudged.current) {
        nudged.current = true
        showToast(`Saved ${a.name} — become a Spotter to lock it in`)
      }
      return
    }
    if (alreadySpotted.has(a.ticker)) {
      showToast(`You'd already spotted ${a.name}`)
      return
    }
    spot(a.ticker)
      .then((r) => showToast(r ? `◆ Spotter #${fmtCount(r.spotterNumber)} for ${a.name}` : `◆ Spotted ${a.name}`))
      .catch(() => showToast(`Couldn't spot ${a.name} — try again from their profile`))
  }, [isAuthenticated, alreadySpotted, spot, showToast])

  const onOpen = useCallback((a: Artist) => {
    router.push(`/creator/${a.ticker}`)
  }, [router])

  const restart = useCallback(() => {
    setSeen(0)
    setKept([])
    setDeckKey((k) => k + 1)
  }, [])

  // Progress bar
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(deck.length ? seen / deck.length : 0, { duration: 380, easing: Easing.out(Easing.cubic) })
  }, [seen, deck.length, progress])
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as `${number}%` }))

  const deckW = W - Spacing.md * 2
  const deckH = Math.max(360, H - insets.top - HEADER_H - ACTIONS_H - insets.bottom - 12)

  return (
    <View style={{ flex: 1 }}>
      {/* Scrim: the Observatory stays visible behind the cards */}
      <Animated.View entering={FadeIn.duration(380)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={['rgba(5,5,8,0.96)', 'rgba(5,5,8,0.62)', 'rgba(5,5,8,0.97)']}
          locations={[0.08, 0.5, 0.9]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: Spacing.lg, height: insets.top + HEADER_H }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2, color: Colors.brass }}>◆ DISCOVER MODE</Text>
            <Text style={{ fontFamily: FontFamily.serif, fontSize: 26, lineHeight: 31, color: Colors.offWhite, marginTop: 4 }}>
              One card. <Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>One call.</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close Discover Mode"
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: 20 }}>×</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Animated.View style={[{ height: 2, backgroundColor: Colors.brass }, barStyle]} />
          </View>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>
            {Math.min(seen + 1, deck.length)} / {deck.length}
          </Text>
        </View>
      </View>

      {/* Deck / summary */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        {!done ? (
          <Animated.View entering={FadeInDown.duration(480).easing(Easing.out(Easing.cubic))}>
            <SwipeDeck
              key={deckKey}
              ref={deckRef}
              artists={deck}
              width={deckW}
              height={deckH}
              spotted={alreadySpotted}
              onDecision={onDecision}
              onOpen={onOpen}
            />
          </Animated.View>
        ) : (
          <Summary
            kept={kept}
            authed={isAuthenticated}
            onBack={() => router.back()}
            onRestart={restart}
            onJoin={() => router.push('/auth/signup')}
          />
        )}
      </View>

      {/* Actions */}
      {!done && (
        <View style={{ height: ACTIONS_H + insets.bottom, paddingBottom: insets.bottom, paddingHorizontal: Spacing.lg, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <GoldButton variant="outline" fullWidth onPress={() => deckRef.current?.swipe(-1)}>Pass</GoldButton>
            </View>
            <View style={{ flex: 1 }}>
              <GoldButton fullWidth shimmer onPress={() => deckRef.current?.swipe(1)}>Spot ◆</GoldButton>
            </View>
          </View>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1.4, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 12 }}>
            SWIPE RIGHT TO SPOT · LEFT TO PASS · TAP FOR PROFILE
          </Text>
        </View>
      )}

      {/* Toast */}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutUp.duration(260)}
          pointerEvents="none"
          style={{
            position: 'absolute', top: insets.top + HEADER_H + 4, alignSelf: 'center', maxWidth: W - 48,
            paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18,
            backgroundColor: 'rgba(12,10,6,0.94)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.45)',
          }}
        >
          <Text numberOfLines={2} style={{ fontFamily: FontFamily.mono, fontSize: 10, letterSpacing: 0.4, color: Colors.brassLight, textAlign: 'center' }}>
            {toast.text}
          </Text>
        </Animated.View>
      )}
    </View>
  )
}

function Summary({ kept, authed, onBack, onRestart, onJoin }: {
  kept: Artist[]; authed: boolean; onBack: () => void; onRestart: () => void; onJoin: () => void
}) {
  return (
    <Animated.View entering={FadeInDown.duration(520)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: 16 }}>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2, color: Colors.brassDim }}>── THAT'S THE FIELD ──</Text>
      <Text style={{ fontFamily: FontFamily.serif, fontSize: 40, lineHeight: 46, color: Colors.offWhite, textAlign: 'center' }}>
        {kept.length === 0 ? 'Nothing caught\nyour ear' : kept.length === 1 ? 'You called\none early' : `You called\n${kept.length} early`}
        <Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>{kept.length === 0 ? ' — yet.' : '.'}</Text>
      </Text>

      {kept.length > 0 && (
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {kept.slice(0, 7).map((a, i) => (
            <ArtistImage key={a.ticker} uri={a.imageUrl} style={{
              width: 46, height: 46, borderRadius: 23, marginLeft: i === 0 ? 0 : -12,
              borderWidth: 2, borderColor: '#0b0906',
            }} />
          ))}
        </View>
      )}
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 10, lineHeight: 16, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
        {kept.length === 0
          ? 'New artists arrive every week.'
          : authed
            ? 'Every spot is a timestamp — evidence you were early.'
            : 'Become a Spotter to lock these in\nbefore the world catches on.'}
      </Text>

      <View style={{ gap: 12, marginTop: 10, alignItems: 'center' }}>
        {!authed && kept.length > 0 ? (
          <GoldButton onPress={onJoin} shimmer effect="crack">Become a Spotter ↗</GoldButton>
        ) : (
          <GoldButton onPress={onBack} shimmer effect="crack">Back to the Observatory</GoldButton>
        )}
        <GoldButton onPress={onRestart} variant="outline">Run it back</GoldButton>
      </View>
    </Animated.View>
  )
}
