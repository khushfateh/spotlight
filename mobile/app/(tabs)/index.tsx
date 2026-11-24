import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native'
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
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useIsFocused, useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Shadow } from '@/lib/tokens'
import HomeScene3D from '@/components/experience/scene/HomeScene3D'
import { sceneState } from '@/components/experience/scene/sceneState'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GoldButton from '@/components/ui/GoldButton'
import GoldDivider from '@/components/ui/GoldDivider'
import ArtistRow from '@/components/ui/ArtistRow'
import { useAuth } from '@/context/AuthContext'
import { useMomentum } from '@/context/MomentumContext'
import { CREATORS } from '@/lib/data/creators'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
// Hero fills (almost) the whole first screen — the saxophone is the main attraction
const CANVAS_H = Math.round(SCREEN_H * 0.95)

function setSceneScroll(y: number) {
  sceneState.scrollProgress = Math.max(0, Math.min(1, y / CANVAS_H))
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { getScore } = useMomentum()

  // Top 5 by score — live when available, falls back to static
  const FEATURED = Object.entries(CREATORS)
    .map(([ticker, c]) => {
      const { score, delta } = getScore(ticker)
      return { name: c.name, ticker, score, delta }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const scrollY   = useSharedValue(0)
  const heroOp    = useSharedValue(0)
  const heroY     = useSharedValue(24)
  const isFocused = useIsFocused()

  // Device tilt → plays the role of the web cursor (dust drift, spot light,
  // camera parallax, sax lean). Paused when the tab isn't visible.
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

  // Horizontal swipe on the hero spins the saxophone; vertical still scrolls
  const spinGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onChange((e) => {
      sceneState.dragRotY += e.changeX * 0.012
      sceneState.dragRotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, sceneState.dragRotX + e.changeY * 0.004))
    })

  useEffect(() => {
    heroOp.value = withDelay(400, withTiming(1,  { duration: 700, easing: Easing.out(Easing.cubic) }))
    heroY.value  = withDelay(400, withTiming(0,  { duration: 700, easing: Easing.out(Easing.cubic) }))
  }, [])

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
    // Scene reads scroll on the JS thread (inside its render loop)
    if (e.contentOffset.y <= CANVAS_H * 1.1) scheduleOnRN(setSceneScroll, e.contentOffset.y)
  })

  const heroParallaxStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(scrollY.value, [0, CANVAS_H * 0.5], [1, 0],  Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(scrollY.value, [0, CANVAS_H], [0, -CANVAS_H * 0.25], Extrapolation.CLAMP),
    }],
  }))

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, CANVAS_H * 0.9], [1, 0.12], Extrapolation.CLAMP),
  }))

  const entryStyle = useAnimatedStyle(() => ({
    opacity: heroOp.value,
    transform: [{ translateY: heroY.value }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* ── 3D exhibition: real saxophone + gold dust + threads ────────── */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: CANVAS_H }, sceneStyle]} pointerEvents="none">
        <HomeScene3D width={W} height={CANVAS_H} active={isFocused} />
      </Animated.View>

      {/* ── Bottom fade from canvas into content ─────────────────────── */}
      <LinearGradient
        colors={['transparent', Colors.void]}
        style={{
          position: 'absolute',
          top: CANVAS_H - 160,
          left: 0, right: 0,
          height: 200,
          zIndex: 1,
        }}
        pointerEvents="none"
      />

      {/* ── Scroll container ──────────────────────────────────────────── */}
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1, zIndex: 2 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero zone — overlays the canvas; swipe sideways to spin the sax */}
        <GestureDetector gesture={spinGesture}>
        <Animated.View style={[heroParallaxStyle, {
          height: CANVAS_H,
          justifyContent: 'flex-end',
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.xl + 8,
        }]}>
          <Animated.View style={entryStyle}>
            <MonoLabel
              size="label"
              color={Colors.brassDim}
              style={{ marginBottom: Spacing.md, letterSpacing: 0.5 }}
            >
              ◈ Discover · Spot · Remember
            </MonoLabel>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{
                fontFamily: FontFamily.serif,
                fontSize:   FontSize.display,
                color:      Colors.offWhite,
                lineHeight: 54,
                letterSpacing: 0.01,
              }}>
                Discover{'\n'}
                <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>
                  future icons
                </Text>
                {'\n'}before everyone else
              </Text>
            </View>

            <Text style={{
              fontFamily:    FontFamily.mono,
              fontSize:      FontSize.caption,
              color:         'rgba(255,255,255,0.38)',
              lineHeight:    19,
              letterSpacing: 0.04,
              marginBottom:  Spacing.xl,
              maxWidth:      280,
            }}>
              Spot rising creators before they blow up.{'\n'}
              Your vault card is stamped with the moment you called it.
            </Text>

            <GoldButton
              onPress={() => router.push(isAuthenticated ? '/discover' : '/auth/signup')}
              shimmer
              style={{ alignSelf: 'flex-start' }}
            >
              {isAuthenticated ? 'Start Discovering ↗' : 'Become a Spotter ↗'}
            </GoldButton>
          </Animated.View>
        </Animated.View>
        </GestureDetector>

        {/* ── Trending Now section ──────────────────────────────────── */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GoldDivider />
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: Spacing.lg,
            marginBottom: Spacing.md,
          }}>
            <View>
              <MonoLabel size="label" style={{ marginBottom: 5 }}>◆ Trending Now</MonoLabel>
              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.title,
                color:         Colors.offWhite,
                letterSpacing: 0.01,
              }}>
                Rising Fast
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/discover')}
              hitSlop={8}
            >
              <MonoLabel size="label" color={Colors.brass}>See all →</MonoLabel>
            </Pressable>
          </View>

          {FEATURED.map((artist, i) => (
            <ArtistRow
              key={artist.ticker}
              rank={i + 1}
              name={artist.name}
              ticker={artist.ticker}
              score={artist.score}
              delta={artist.delta}
              onPress={() => router.push(`/creator/${artist.ticker}`)}
              delay={i * 60}
            />
          ))}
        </View>

        {/* ── Observatory CTA ───────────────────────────────────────── */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.section }}>
          <GoldDivider />
          <View style={{ paddingTop: Spacing.xl, alignItems: 'center', paddingBottom: Spacing.lg }}>
            <MonoLabel size="label" style={{ marginBottom: Spacing.sm }}>◈ The Observatory</MonoLabel>
            <Text style={{
              fontFamily:    FontFamily.serif,
              fontSize:      FontSize.heading,
              color:         Colors.offWhite,
              textAlign:     'center',
              letterSpacing: 0.01,
              marginBottom:  Spacing.sm,
            }}>
              Who&apos;s{' '}
              <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>
                next?
              </Text>
            </Text>
            <Text style={{
              fontFamily:    FontFamily.mono,
              fontSize:      FontSize.caption,
              color:         'rgba(255,255,255,0.32)',
              textAlign:     'center',
              letterSpacing: 0.04,
              lineHeight:    20,
              marginBottom:  Spacing.xl,
            }}>
              Discover tomorrow&apos;s cultural icons{'\n'}before the world does.
            </Text>
            <GoldButton
              onPress={() => router.push('/discover')}
              variant="outline"
            >
              Enter the Observatory →
            </GoldButton>
          </View>
        </View>
      </AnimatedScrollView>
    </View>
  )
}
