// VaultCinematic — full-screen cinematic played when you open your vault card.
// Glass card materializes with a spotter count-up + stamp seal animation.
// SuccessFlare handles the Skia particle burst (already production-tested).

import { useEffect, useRef, useState } from 'react'
import {
  Dimensions, Modal, Platform, Pressable,
  StyleSheet, Text, View,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, withDelay,
  Easing, runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Shadow, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import ScoreBar from '@/components/ui/ScoreBar'
import SpottedBadge from '@/components/ui/SpottedBadge'
import SuccessFlare from '@/components/ui/SuccessFlare'

const { width: W, height: H } = Dimensions.get('window')

export type VaultCinematicProps = {
  visible:        boolean
  onDismiss:      () => void
  artistName:     string
  ticker:         string
  spotterNumber:  number
  score:          number
  tier:           string
  isFoundingSpot: boolean
}

export default function VaultCinematic({
  visible, onDismiss, artistName, ticker, spotterNumber, score, tier, isFoundingSpot,
}: VaultCinematicProps) {
  // ── Animation values ──────────────────────────────────────────────────────
  const bgOp         = useSharedValue(0)
  const iconS        = useSharedValue(0.4)
  const iconOp       = useSharedValue(0)
  const cardY        = useSharedValue(40)
  const cardOp       = useSharedValue(0)
  const cardS        = useSharedValue(0.88)
  const sealOp       = useSharedValue(0)
  const sealS        = useSharedValue(0.7)
  const captionOp    = useSharedValue(0)
  const hintOp       = useSharedValue(0)
  const glowS        = useSharedValue(0.6)
  const glowOp       = useSharedValue(0)

  // ── JS-thread counter ─────────────────────────────────────────────────────
  const [displayedCount, setDisplayedCount] = useState(0)
  const [showFlare,      setShowFlare]      = useState(false)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountUp = () => {
    if (countRef.current) clearInterval(countRef.current)
    let count = Math.max(1, spotterNumber - 50)
    setDisplayedCount(count)
    countRef.current = setInterval(() => {
      count = Math.min(count + 4, spotterNumber)
      setDisplayedCount(count)
      if (count >= spotterNumber) clearInterval(countRef.current!)
    }, 18)
  }

  const fireFlare = () => {
    setShowFlare(true)
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  // ── Sequence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      bgOp.value     = 0
      iconS.value    = 0.4
      iconOp.value   = 0
      cardY.value    = 40
      cardOp.value   = 0
      cardS.value    = 0.88
      sealOp.value   = 0
      sealS.value    = 0.7
      captionOp.value = 0
      hintOp.value   = 0
      glowS.value    = 0.6
      glowOp.value   = 0
      setDisplayedCount(0)
      setShowFlare(false)
      if (countRef.current) clearInterval(countRef.current)
      return
    }

    // 0ms: dark void materialises
    bgOp.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })

    // 160ms: ambient glow blooms behind the card
    glowOp.value = withDelay(160, withTiming(1, { duration: 600 }))
    glowS.value  = withDelay(160, withSpring(1, { damping: 14, stiffness: 60 }))

    // 240ms: central ◈ icon pops in
    iconOp.value = withDelay(240, withTiming(1, { duration: 340 }))
    iconS.value  = withDelay(240,
      withSequence(
        withTiming(1.22, { duration: 400, easing: Easing.out(Easing.back(2.6)) }),
        withSpring(1,    { damping: 14,  stiffness: 160 }),
      )
    )

    // 700ms: glass card materialises from below
    cardOp.value = withDelay(700, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }))
    cardY.value  = withDelay(700, withTiming(0, { duration: 540, easing: Easing.out(Easing.cubic) }))
    cardS.value  = withDelay(700, withSpring(1, { damping: 18, stiffness: 200 }))

    // 1200ms: spotter count-up begins
    setTimeout(() => runOnJS(startCountUp)(), 1200)

    // 1600ms: particle burst
    setTimeout(() => runOnJS(fireFlare)(), 1600)

    // 1900ms: SEALED stamp animates in
    sealOp.value = withDelay(1900, withTiming(1, { duration: 300 }))
    sealS.value  = withDelay(1900,
      withSequence(
        withTiming(1.1, { duration: 260, easing: Easing.out(Easing.back(1.8)) }),
        withSpring(1,   { damping: 18,  stiffness: 280 }),
      )
    )

    // 2500ms: caption lines
    captionOp.value = withDelay(2500, withTiming(1, { duration: 480 }))

    // 3400ms: tap-to-dismiss hint
    hintOp.value = withDelay(3400, withTiming(1, { duration: 600 }))
  }, [visible])

  // ── Animated styles ───────────────────────────────────────────────────────
  const bgStyle     = useAnimatedStyle(() => ({ opacity: bgOp.value }))
  const glowStyle   = useAnimatedStyle(() => ({
    opacity: glowOp.value,
    transform: [{ scale: glowS.value }],
  }))
  const iconStyle   = useAnimatedStyle(() => ({
    opacity: iconOp.value, transform: [{ scale: iconS.value }],
  }))
  const cardStyle   = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ translateY: cardY.value }, { scale: cardS.value }],
  }))
  const sealStyle   = useAnimatedStyle(() => ({
    opacity: sealOp.value, transform: [{ scale: sealS.value }],
  }))
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOp.value }))
  const hintStyle    = useAnimatedStyle(() => ({ opacity: hintOp.value }))

  const scoreColor = score >= 90 ? Colors.brass : score >= 76 ? Colors.brassLight : Colors.dimWhite

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* ── Void background ─────────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle, { backgroundColor: 'rgba(2,2,5,0.97)' }]} />

      {/* ── Ambient glow bloom ──────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[glowStyle, {
          position: 'absolute',
          width: W * 1.4,
          height: W * 1.4,
          left: W * 0.5 - W * 0.7,
          top:  H * 0.38  - W * 0.7,
          borderRadius: W * 0.7,
          backgroundColor: 'rgba(201,168,76,0.0)',
          shadowColor: Colors.brass,
          shadowOpacity: 0.5,
          shadowRadius: 160,
          shadowOffset: { width: 0, height: 0 },
        }]}
      />

      {/* ── UI layer ────────────────────────────────────────────────────── */}
      <Pressable
        style={[StyleSheet.absoluteFill, {
          justifyContent:  'center',
          alignItems:      'center',
          paddingHorizontal: Spacing.lg,
        }]}
        onPress={onDismiss}
      >
        {/* Central ◈ icon */}
        <Animated.View style={[iconStyle, {
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: 'rgba(201,168,76,0.08)',
          borderWidth: 1.5, borderColor: Colors.brass,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: Spacing.lg,
          ...Shadow.goldStrong,
        }]}>
          <Text style={{
            color:    Colors.brass,
            fontSize: 28,
            textShadowColor: Colors.brass,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
          }}>◈</Text>
        </Animated.View>

        {/* Glass vault card */}
        <Animated.View style={[cardStyle, { width: '100%', maxWidth: 340 }]}>
          <GlassCard goldBorder glow>
            <View style={{ padding: Spacing.md + 4 }}>

              {/* Founding badge */}
              {isFoundingSpot && (
                <View style={{ marginBottom: Spacing.sm }}>
                  <SpottedBadge label="◈ Founding Spotter" />
                </View>
              )}

              {/* Artist + score */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                  <Text style={{
                    fontFamily:    FontFamily.serif,
                    fontSize:      FontSize.heading,
                    color:         Colors.offWhite,
                    letterSpacing: 0.01,
                    lineHeight:    36,
                  }}>
                    {artistName}
                  </Text>
                  <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 3 }}>
                    {ticker}
                  </MonoLabel>
                </View>
                <View style={{ alignItems: 'flex-end', paddingTop: 4 }}>
                  <Text style={{
                    fontFamily:    FontFamily.monoBold,
                    fontSize:      40,
                    color:         Colors.offWhite,
                    letterSpacing: -1.5,
                    lineHeight:    44,
                  }}>
                    {score}
                  </Text>
                  <MonoLabel size="label" color={Colors.brass}>Score</MonoLabel>
                </View>
              </View>

              <ScoreBar score={score} color={scoreColor} style={{ marginBottom: Spacing.md }} />

              {/* Spotter number */}
              <View style={{
                borderTopWidth: 1,
                borderTopColor: 'rgba(201,168,76,0.08)',
                paddingTop: Spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <View>
                  <MonoLabel size="label" color="rgba(255,255,255,0.28)">You are</MonoLabel>
                  <Text style={{
                    fontFamily:    FontFamily.monoBold,
                    fontSize:      26,
                    color:         Colors.brass,
                    letterSpacing: -0.5,
                    marginTop:     2,
                    textShadowColor: Colors.brass,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                  }}>
                    Spotter #{displayedCount.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <MonoLabel size="label" color="rgba(255,255,255,0.22)">Tier</MonoLabel>
                  <MonoLabel size="caption" color={Colors.brassDim} style={{ marginTop: 2 }}>
                    {tier}
                  </MonoLabel>
                </View>
              </View>

              {/* SEALED stamp */}
              <Animated.View style={[sealStyle, {
                borderTopWidth: 1,
                borderTopColor: 'rgba(201,168,76,0.08)',
                paddingTop: Spacing.sm,
                marginTop: Spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }]}>
                <Text style={{ color: Colors.brass, fontSize: 10 }}>◈</Text>
                <Text style={{
                  fontFamily:    FontFamily.mono,
                  fontSize:      7,
                  color:         Colors.brass,
                  letterSpacing: 0.15,
                  textTransform: 'uppercase',
                }}>
                  SEALED · {new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  }).toUpperCase()}
                </Text>
              </Animated.View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Caption */}
        <Animated.View style={[captionStyle, { marginTop: Spacing.xl, alignItems: 'center' }]}>
          <Text style={{
            fontFamily:    FontFamily.serifItalic,
            fontSize:      FontSize.bodyLg + 2,
            color:         'rgba(255,255,255,0.55)',
            textAlign:     'center',
            letterSpacing: 0.02,
            lineHeight:    26,
          }}>
            Sealed in the vault forever.
          </Text>
          <Text style={{
            fontFamily:    FontFamily.mono,
            fontSize:      FontSize.caption,
            color:         Colors.brassDim,
            textAlign:     'center',
            letterSpacing: 0.08,
            marginTop:     6,
          }}>
            Your cultural legacy is on record.
          </Text>
        </Animated.View>

        {/* Tap to dismiss */}
        <Animated.View style={[hintStyle, { position: 'absolute', bottom: 60 }]}>
          <MonoLabel size="label" color="rgba(255,255,255,0.18)">
            Tap anywhere to continue
          </MonoLabel>
        </Animated.View>
      </Pressable>

      {/* SuccessFlare — Skia particles, originates from card center ───── */}
      <SuccessFlare
        visible={showFlare}
        originX={W / 2}
        originY={H * 0.44}
        onComplete={() => setShowFlare(false)}
      />
    </Modal>
  )
}
