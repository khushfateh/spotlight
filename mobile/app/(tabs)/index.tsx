/**
 * Home — the exhibition.
 *
 *   Page 0  Hero: the saxophone reveal + "Discover future icons…"
 *   Page 1–4  Story chapters 02–05 (web LeftStorytelling). As soon as the
 *             user starts scrolling, the artist cards spiral out and orbit the
 *             saxophone; each page turns the orbit ~108°.
 *
 * One chapter per swipe (native paging) so it feels like turning pages. All
 * text motion runs on the UI thread (Reanimated); the 3D scene reads scroll on
 * the JS thread and damps toward it, so nothing ever jumps.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Dimensions, Platform, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useIsFocused, useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import HomeScene3D from '@/components/experience/scene/HomeScene3D'
import { sceneState } from '@/components/experience/scene/sceneState'
import { ORBIT_ARTISTS } from '@/components/experience/scene/OrbitalCards'
import MonoLabel from '@/components/ui/MonoLabel'
import GoldButton from '@/components/ui/GoldButton'
import { useAuth } from '@/context/AuthContext'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const TAB_BAR_H = 72   // floating tab bar row (plus the bottom safe-area inset)
const LABEL_W = 160    // front-card name label width
const HERO_FALLBACK_MS = 7000  // show the hero text even if the model is slow to load

// Web LeftStorytelling chapters 02–05 (01 is the hero)
const CHAPTERS = [
  { label: '02', headline: 'Every Legend', accent: 'Was Once Unknown', sub: 'Before Coachella. Before the charts.\nBefore the world knew their name.' },
  { label: '03', headline: 'Your Taste Creates', accent: "Tomorrow's Culture", sub: 'Every Spot becomes part of\nyour Discovery Legacy.' },
  { label: '04', headline: 'Collect Moments Before', accent: 'The World Notices', sub: 'Every spot is a timestamp.\nEvidence you were early.' },
  { label: '05', headline: 'The Next Icon Is', accent: 'Already Moving', sub: null, cta: 'Begin Discovering →' },
] as const
const PAGE_COUNT = 1 + CHAPTERS.length

function setSceneScroll(y: number, pageH: number) {
  sceneState.pageProgress = Math.max(0, y / pageH)
  sceneState.scrollProgress = Math.max(0, Math.min(1, y / (pageH * (PAGE_COUNT - 1))))
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const isFocused = useIsFocused()

  // Page height = the ScrollView's own height (exact for native paging)
  const [pageH, setPageH] = useState(SCREEN_H)
  const pageHSV = useSharedValue(SCREEN_H)
  const onScrollLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height)
    if (h > 0) { setPageH(h); pageHSV.value = h }
  }, [pageHSV])

  const scrollY = useSharedValue(0)
  const heroOp  = useSharedValue(0)
  const heroY   = useSharedValue(24)
  const textBottom = insets.bottom + TAB_BAR_H + Spacing.lg

  // ── Device tilt → plays the role of the web cursor ─────────────────────────
  useEffect(() => {
    if (!isFocused) return
    let sub: { remove: () => void } | null = null
    try {
      const { Accelerometer } = require('expo-sensors')
      Accelerometer.setUpdateInterval(50)
      sub = Accelerometer.addListener(({ x, y }: { x: number; y: number }) => {
        sceneState.pointerX = Math.max(-1, Math.min(1, x))
        sceneState.pointerY = Math.max(-1, Math.min(1, y + 0.5))  // phone is held tilted ~30°
      })
    } catch {}
    return () => sub?.remove()
  }, [isFocused])

  // Returning to Home (e.g. back from an artist profile) → cards back in orbit
  const [resetKey, setResetKey] = useState(0)
  useEffect(() => { if (isFocused) setResetKey((k) => k + 1) }, [isFocused])

  // ── Card tap → profile ─────────────────────────────────────────────────────
  const onSelectArtist = useCallback((ticker: string) => {
    router.push(`/creator/${ticker}`)
  }, [router])

  // ── Front-card name label (native text, follows the focus slot) ────────────
  const [focusIndex, setFocusIndex] = useState(-1)
  const labelX = useSharedValue(W * 0.75)
  const labelY = useSharedValue(SCREEN_H * 0.45)
  const labelOp = useSharedValue(0)
  const onFocusChange = useCallback((i: number, strength: number, p: { x: number; y: number }) => {
    if (i >= 0) setFocusIndex(i)
    labelX.value = p.x
    labelY.value = p.y
    labelOp.value = withTiming(strength, { duration: 180 })
  }, [labelX, labelY, labelOp])
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOp.value,
    transform: [
      // centred under the card, but never past the screen edges
      { translateX: Math.max(8, Math.min(W - LABEL_W - 8, labelX.value - LABEL_W / 2)) },
      { translateY: labelY.value + interpolate(labelOp.value, [0, 1], [6, 0]) },
    ],
  }))
  const focusArtist = focusIndex >= 0 ? ORBIT_ARTISTS[focusIndex] : null

  // ── Gestures: sideways swipe spins the sax; tap picks an orbiting card ─────
  // While the user plays with the sax, the hero text steps aside (→ 20%),
  // and returns 1.5 s after they let go.
  const heroDim = useSharedValue(1)
  const spin = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onStart(() => {
      heroDim.value = withTiming(0.2, { duration: 220 })
    })
    .onChange((e) => {
      sceneState.dragRotY += e.changeX * 0.012
      sceneState.dragRotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, sceneState.dragRotX + e.changeY * 0.004))
    })
    .onFinalize(() => {
      heroDim.value = withDelay(1500, withTiming(1, { duration: 450 }))
    })
  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDistance(10)
    .onEnd((e, success) => {
      if (!success) return
      // Canvas is pinned at the top-left of this screen → absolute == canvas coords
      sceneState.tap = { x: e.absoluteX, y: e.absoluteY }
    })
  const gestures = Gesture.Race(spin, tap)

  // ── Hero entry: the saxophone first, then the words ────────────────────────
  // Text arrives once the brass reveal completes (scene callback), with a
  // fallback so it can never stay hidden if the model is slow.
  const heroShown = useRef(false)
  const showHero = useCallback(() => {
    if (heroShown.current) return
    heroShown.current = true
    heroOp.value = withDelay(150, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }))
    heroY.value  = withDelay(150, withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) }))
  }, [heroOp, heroY])
  useEffect(() => {
    const id = setTimeout(showHero, HERO_FALLBACK_MS)
    return () => clearTimeout(id)
  }, [showHero])

  // ── Scroll: UI-thread text motion + JS-thread scene progress ───────────────
  const lastPage = useRef(0)
  const onPage = useCallback((page: number) => {
    if (page !== lastPage.current) {
      lastPage.current = page
      if (Platform.OS !== 'web') Haptics.selectionAsync()
    }
  }, [])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y
      scheduleOnRN(setSceneScroll, e.contentOffset.y, pageHSV.value)
    },
    onMomentumEnd: (e) => {
      scheduleOnRN(onPage, Math.round(e.contentOffset.y / pageHSV.value))
    },
  })

  const heroStyle = useAnimatedStyle(() => {
    const h = pageHSV.value
    return {
      opacity: interpolate(scrollY.value, [0, h * 0.35], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollY.value, [0, h], [0, h * 0.18], Extrapolation.CLAMP) }],
    }
  })
  const entryStyle = useAnimatedStyle(() => ({
    opacity: heroOp.value * heroDim.value,
    transform: [{ translateY: heroY.value }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* ── 3D exhibition: saxophone, gold dust, threads, orbiting artists ─ */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: W, height: SCREEN_H }} pointerEvents="none">
        <HomeScene3D
          width={W}
          height={SCREEN_H}
          active={isFocused}
          onSelectArtist={onSelectArtist}
          onFocusChange={onFocusChange}
          onRevealComplete={showHero}
          resetKey={resetKey}
        />
      </View>

      {/* ── Legibility fade behind the chapter text ───────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(5,5,8,0.55)', 'rgba(5,5,8,0.9)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: SCREEN_H * 0.42 }}
        pointerEvents="none"
      />

      {/* ── Front-card name (native text — crisp at any size) ─────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 0, left: 0, width: LABEL_W, alignItems: 'center' }, labelStyle]}
      >
        {focusArtist && (
          <>
            <Text numberOfLines={1} style={{
              fontFamily: FontFamily.serif, fontSize: 15, color: 'rgba(255,255,255,0.92)',
              letterSpacing: 0.6, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 12,
            }}>
              {focusArtist.name}
            </Text>
            <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 2 }}>
              {focusArtist.genre}
            </MonoLabel>
          </>
        )}
      </Animated.View>

      {/* ── Story pages ───────────────────────────────────────────────────── */}
      <AnimatedScrollView
        onLayout={onScrollLayout}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Gestures live on the content (not the ScrollView) so native vertical
            paging is never blocked */}
        <GestureDetector gesture={gestures}>
        <View>
          {/* Page 0 — hero */}
          <Animated.View style={[heroStyle, {
            height: pageH,
            justifyContent: 'flex-end',
            paddingHorizontal: Spacing.lg,
            paddingBottom: textBottom,
          }]}>
            <Animated.View style={entryStyle}>
              {/* Chapter 01 — same type scale as chapters 02–05 (web copy) */}
              <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: Spacing.sm, letterSpacing: 1 }}>
                01 ─────
              </MonoLabel>
              <Text style={{
                fontFamily: FontFamily.serif, fontSize: 38, lineHeight: 44, color: Colors.offWhite,
                letterSpacing: 0.01, marginBottom: Spacing.lg,
              }}>
                Discover Future Icons{'\n'}
                <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>Before Everyone Else</Text>
              </Text>
              <GoldButton
                onPress={() => router.push(isAuthenticated ? '/discover' : '/auth/signup')}
                shimmer
                effect="crack"
                size="sm"
                style={{ alignSelf: 'flex-start' }}
              >
                {isAuthenticated ? 'Start Discovering ↗' : 'Become a Spotter ↗'}
              </GoldButton>
              <ScrollCue scrollY={scrollY} />
            </Animated.View>
          </Animated.View>

          {/* Pages 1–4 — chapters */}
          {CHAPTERS.map((ch, i) => (
            <Chapter
              key={ch.label}
              index={i + 1}
              chapter={ch}
              scrollY={scrollY}
              pageH={pageH}
              pageHSV={pageHSV}
              bottom={textBottom}
              onCta={() => router.push('/discover')}
            />
          ))}
        </View>
        </GestureDetector>
      </AnimatedScrollView>

      <PageDots scrollY={scrollY} pageHSV={pageHSV} top={insets.top + 14} />
    </View>
  )
}

/**
 * One line of a chapter. p = page offset: -1 (page below) → 0 (settled) → +1
 * (scrolled past). Lines arrive late and staggered from below, and leave early
 * upward — a page-turn feel. Runs entirely on the UI thread.
 */
function useChapterLine(scrollY: SharedValue<number>, pageHSV: SharedValue<number>, index: number, delay: number) {
  return useAnimatedStyle(() => {
    const h = pageHSV.value
    const p = (scrollY.value - index * h) / h
    const enter = interpolate(p, [-0.62 + delay, -0.08 + delay * 0.5], [0, 1], Extrapolation.CLAMP)
    const exit  = interpolate(p, [0.08, 0.42], [1, 0], Extrapolation.CLAMP)
    return {
      opacity: enter * exit,
      transform: [{ translateY: (1 - enter) * 26 - (1 - exit) * 18 }],
    }
  })
}

// ── One story chapter: label → headline → sub → CTA, staggered on arrival ────
function Chapter({
  index, chapter, scrollY, pageH, pageHSV, bottom, onCta,
}: {
  index: number
  chapter: typeof CHAPTERS[number]
  scrollY: SharedValue<number>
  pageH: number
  pageHSV: SharedValue<number>
  bottom: number
  onCta: () => void
}) {
  const labelStyle = useChapterLine(scrollY, pageHSV, index, 0)
  const headStyle  = useChapterLine(scrollY, pageHSV, index, 0.06)
  const subStyle   = useChapterLine(scrollY, pageHSV, index, 0.12)
  const ctaStyle   = useChapterLine(scrollY, pageHSV, index, 0.18)

  return (
    <View style={{ height: pageH, justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingBottom: bottom }}>
      <Animated.View style={labelStyle}>
        <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: Spacing.sm, letterSpacing: 1 }}>
          {chapter.label} ─────
        </MonoLabel>
      </Animated.View>
      <Animated.View style={headStyle}>
        <Text style={{
          fontFamily: FontFamily.serif, fontSize: 38, lineHeight: 44, color: Colors.offWhite,
          letterSpacing: 0.01, marginBottom: Spacing.md,
        }}>
          {chapter.headline}{'\n'}
          <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>{chapter.accent}</Text>
        </Text>
      </Animated.View>
      {chapter.sub && (
        <Animated.View style={subStyle}>
          <Text style={{
            fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.42)',
            lineHeight: 19, letterSpacing: 0.04,
          }}>
            {chapter.sub}
          </Text>
        </Animated.View>
      )}
      {'cta' in chapter && chapter.cta && (
        <Animated.View style={[ctaStyle, { marginTop: Spacing.sm }]}>
          <GoldButton onPress={onCta} shimmer effect="crack" style={{ alignSelf: 'flex-start' }}>
            {chapter.cta}
          </GoldButton>
        </Animated.View>
      )}
    </View>
  )
}

// ── "Scroll" cue on the hero — invites the first scroll that releases the orbit
function ScrollCue({ scrollY }: { scrollY: SharedValue<number> }) {
  const pulse = useSharedValue(0)
  useEffect(() => {
    pulse.value = withDelay(2600, withTiming(1, { duration: 900 }))
  }, [pulse])
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value * interpolate(scrollY.value, [0, 60], [0.55, 0], Extrapolation.CLAMP),
  }))
  return (
    <Animated.View style={[{ marginTop: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <View style={{ width: 1, height: 18, backgroundColor: Colors.brass, opacity: 0.6 }} />
      <MonoLabel size="label" color={Colors.brassDim} style={{ letterSpacing: 2 }}>
        Scroll to meet the artists
      </MonoLabel>
    </Animated.View>
  )
}

// ── Chapter progress (web's pill dots), top-right ───────────────────────────
function PageDots({ scrollY, pageHSV, top }: { scrollY: SharedValue<number>; pageHSV: SharedValue<number>; top: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, right: Spacing.lg, flexDirection: 'row', gap: 5 }}>
      {Array.from({ length: PAGE_COUNT }, (_, i) => <Dot key={i} i={i} scrollY={scrollY} pageHSV={pageHSV} />)}
    </View>
  )
}

function Dot({ i, scrollY, pageHSV }: { i: number; scrollY: SharedValue<number>; pageHSV: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(scrollY.value / pageHSV.value - i)
    const a = interpolate(d, [0, 1], [1, 0], Extrapolation.CLAMP)
    return {
      width: 5 + 17 * a,
      backgroundColor: `rgba(201,168,76,${0.22 + 0.6 * a})`,
    }
  })
  return <Animated.View style={[{ height: 3, borderRadius: 2 }, style]} />
}
