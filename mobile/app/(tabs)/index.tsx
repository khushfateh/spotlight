'use client'
// Home — Phase 0 shell. Phase 1 will replace the placeholder with HomeScene (R3F saxophone).

import { View, Text, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GoldButton from '@/components/ui/GoldButton'
import GlassCard from '@/components/ui/GlassCard'
import GoldDivider from '@/components/ui/GoldDivider'
import { useAuth } from '@/context/AuthContext'

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

// Mock artists — Phase 1 will pull from useMomentumRanking
const FEATURED = [
  { name: 'AP Dhillon',      ticker: 'APDHILLON',  score: 94 },
  { name: 'Karan Aujla',     ticker: 'KARANAUJLA', score: 91 },
  { name: 'Hanumankind',     ticker: 'HANUMANKIND',score: 88 },
  { name: 'Sabrina Carpenter', ticker: 'SABRINAC', score: 87 },
  { name: 'Doja Cat',        ticker: 'DOJACAT',    score: 85 },
]

export default function HomeScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const { isAuthenticated } = useAuth()
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
  })

  // Parallax hero text
  const heroStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(scrollY.value, [0, 200], [1, 0],  Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 300], [0, -60], Extrapolation.CLAMP) }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* ── Hero void section — Phase 1 replaces this with the R3F canvas ── */}
      <View style={{ height: '55%', backgroundColor: Colors.void, justifyContent: 'flex-end' }}>
        {/* Placeholder glow — Phase 1: 3D saxophone here */}
        <View style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: 280, height: 280, borderRadius: 140,
          backgroundColor: 'rgba(201,168,76,0.04)',
          shadowColor: Colors.brass, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25, shadowRadius: 80,
        }} />
        <View style={{
          position: 'absolute', top: '15%', right: '5%',
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: 'rgba(201,168,76,0.03)',
        }} />

        <Animated.View style={[heroStyle, { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl }]}>
          <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: Spacing.md }}>
            ◈ Discover · Spot · Remember
          </MonoLabel>
          <SerifHeading size="display" style={{ lineHeight: 56, marginBottom: Spacing.md }}>
            Discover{'\n'}
            <Text style={{ color: Colors.brass }}>future icons</Text>
            {'\n'}before everyone else
          </SerifHeading>
          <Text style={{
            fontFamily: FontFamily.mono, fontSize: FontSize.caption,
            color: 'rgba(255,255,255,0.40)', lineHeight: 20,
            letterSpacing: 0.04, marginBottom: Spacing.xl,
          }}>
            Spot rising creators before they blow up.{'\n'}
            Your vault card is stamped with the moment you called it.
          </Text>

          <GoldButton
            onPress={() => router.push(isAuthenticated ? '/discover' : '/auth/signup')}
            style={{ alignSelf: 'flex-start' }}
          >
            {isAuthenticated ? 'Start Discovering ↗' : 'Become a Spotter ↗'}
          </GoldButton>
        </Animated.View>
      </View>

      {/* ── Scroll content ── */}
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trending section */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
          <GoldDivider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: Spacing.md }}>
            <View>
              <MonoLabel size="label" style={{ marginBottom: 6 }}>◆ Trending Now</MonoLabel>
              <SerifHeading size="title">Rising Fast</SerifHeading>
            </View>
            <Pressable onPress={() => router.push('/discover')}>
              <MonoLabel size="label" color={Colors.brass}>See all →</MonoLabel>
            </Pressable>
          </View>

          {FEATURED.map((artist, i) => (
            <Pressable
              key={artist.ticker}
              onPress={() => router.push(`/creator/${artist.ticker}`)}
            >
              <GlassCard goldBorder style={{ marginBottom: Spacing.sm, padding: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    {/* Rank */}
                    <MonoLabel size="caption" color="rgba(255,255,255,0.20)" style={{ width: 20 }}>
                      {String(i + 1).padStart(2, '0')}
                    </MonoLabel>
                    {/* Avatar placeholder */}
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: 'rgba(201,168,76,0.08)',
                      borderWidth: 1, borderColor: Colors.glassBorder,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: Colors.brass, fontSize: 16 }}>◈</Text>
                    </View>
                    {/* Name */}
                    <View>
                      <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.body, color: Colors.offWhite, letterSpacing: 0.01 }}>
                        {artist.name}
                      </Text>
                      <MonoLabel size="label" color="rgba(255,255,255,0.28)">{artist.ticker}</MonoLabel>
                    </View>
                  </View>
                  {/* Score */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.body, color: Colors.offWhite, fontWeight: '700' }}>
                      {artist.score}
                    </Text>
                    <MonoLabel size="label" color={Colors.brass}>Score</MonoLabel>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        {/* Discover CTA */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl }}>
          <GoldDivider />
          <View style={{ paddingTop: Spacing.xl, alignItems: 'center' }}>
            <MonoLabel size="label" style={{ marginBottom: Spacing.sm }}>◈ The Observatory</MonoLabel>
            <SerifHeading size="heading" style={{ textAlign: 'center', marginBottom: Spacing.md }}>
              Who&apos;s{' '}
              <Text style={{ color: Colors.brass, fontFamily: FontFamily.serifItalic }}>next?</Text>
            </SerifHeading>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: 0.04, marginBottom: Spacing.xl }}>
              Discover tomorrow&apos;s cultural icons{'\n'}before the world does.
            </Text>
            <GoldButton onPress={() => router.push('/discover')} variant="outline">
              Enter the Observatory →
            </GoldButton>
          </View>
        </View>
      </AnimatedScrollView>
    </View>
  )
}
