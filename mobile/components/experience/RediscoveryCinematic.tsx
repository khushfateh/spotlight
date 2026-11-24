// RediscoveryCinematic — warm, nostalgic return. "You came back."
// Distinct from VaultCinematic (first spot) — softer glow, warmer palette.

import { useEffect, useRef, useState } from 'react'
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withSequence, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Shadow } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import ScoreBar from '@/components/ui/ScoreBar'
import SuccessFlare from '@/components/ui/SuccessFlare'

const { width: W, height: H } = Dimensions.get('window')

export type RediscoveryCinematicProps = {
  visible:       boolean
  onDismiss:     () => void
  artistName:    string
  ticker:        string
  spotterNumber: number
  score:         number
  tier:          string
  rediscoveryCount: number
}

export default function RediscoveryCinematic({
  visible, onDismiss, artistName, ticker, spotterNumber, score, tier, rediscoveryCount,
}: RediscoveryCinematicProps) {
  const bgOp       = useSharedValue(0)
  const glowOp     = useSharedValue(0)
  const iconOp     = useSharedValue(0)
  const iconS      = useSharedValue(0.5)
  const cardOp     = useSharedValue(0)
  const cardY      = useSharedValue(-20)   // drops from above — returns
  const stampOp    = useSharedValue(0)
  const stampS     = useSharedValue(0.8)
  const captionOp  = useSharedValue(0)
  const hintOp     = useSharedValue(0)

  const [displayedCount, setDisplayedCount] = useState(0)
  const [showFlare,      setShowFlare]      = useState(false)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCount = () => {
    if (countRef.current) clearInterval(countRef.current)
    let count = Math.max(1, spotterNumber - 20)
    setDisplayedCount(count)
    countRef.current = setInterval(() => {
      count = Math.min(count + 2, spotterNumber)
      setDisplayedCount(count)
      if (count >= spotterNumber) clearInterval(countRef.current!)
    }, 22)
  }

  useEffect(() => {
    if (!visible) {
      bgOp.value = glowOp.value = iconOp.value = cardOp.value = stampOp.value = captionOp.value = hintOp.value = 0
      iconS.value = 0.5; cardY.value = -20; stampS.value = 0.8
      setDisplayedCount(0); setShowFlare(false)
      if (countRef.current) clearInterval(countRef.current)
      return
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    bgOp.value   = withTiming(1, { duration: 380 })
    glowOp.value = withDelay(160, withTiming(1, { duration: 600 }))

    iconOp.value = withDelay(240, withTiming(1, { duration: 340 }))
    iconS.value  = withDelay(240,
      withSequence(
        withTiming(1.15, { duration: 400, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, { damping: 14, stiffness: 160 }),
      ),
    )

    // Card drops from above
    cardOp.value = withDelay(640, withTiming(1, { duration: 480 }))
    cardY.value  = withDelay(640, withTiming(0, { duration: 540, easing: Easing.out(Easing.cubic) }))

    setTimeout(() => { startCount(); setShowFlare(true) }, 1200)

    stampOp.value = withDelay(1600, withTiming(1, { duration: 300 }))
    stampS.value  = withDelay(1600,
      withSequence(
        withTiming(1.08, { duration: 240, easing: Easing.out(Easing.back(1.8)) }),
        withSpring(1, { damping: 18, stiffness: 280 }),
      ),
    )
    captionOp.value = withDelay(2200, withTiming(1, { duration: 480 }))
    hintOp.value    = withDelay(3200, withTiming(1, { duration: 600 }))
  }, [visible])

  const bgStyle      = useAnimatedStyle(() => ({ opacity: bgOp.value }))
  const glowStyle    = useAnimatedStyle(() => ({ opacity: glowOp.value }))
  const iconStyle    = useAnimatedStyle(() => ({ opacity: iconOp.value, transform: [{ scale: iconS.value }] }))
  const cardStyle    = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }))
  const stampStyle   = useAnimatedStyle(() => ({ opacity: stampOp.value, transform: [{ scale: stampS.value }] }))
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOp.value }))
  const hintStyle    = useAnimatedStyle(() => ({ opacity: hintOp.value }))

  const scoreColor = score >= 90 ? Colors.brass : score >= 76 ? Colors.brassLight : Colors.dimWhite

  if (!visible) return null

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle, { backgroundColor: 'rgba(3,3,6,0.97)' }]} />

      {/* Warm amber ambient — different from VaultCinematic's sharp gold */}
      <Animated.View pointerEvents="none" style={[glowStyle, {
        position: 'absolute',
        width: W * 1.2, height: W * 1.2,
        left: W * 0.5 - W * 0.6, top: H * 0.4 - W * 0.6,
        borderRadius: W * 0.6,
        shadowColor: '#E8A84C',
        shadowOpacity: 0.35, shadowRadius: 140,
        shadowOffset: { width: 0, height: 0 },
      }]} />

      <Pressable
        style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg }]}
        onPress={onDismiss}
      >
        {/* Return icon — ◉ instead of ◈ */}
        <Animated.View style={[iconStyle, {
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: 'rgba(201,168,76,0.07)',
          borderWidth: 1.5, borderColor: 'rgba(232,168,76,0.6)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: Spacing.lg,
          ...Shadow.goldStrong,
        }]}>
          <Text style={{
            color: '#E8A84C', fontSize: 26,
            textShadowColor: '#E8A84C', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
          }}>◉</Text>
        </Animated.View>

        {/* Glass card */}
        <Animated.View style={[cardStyle, { width: '100%', maxWidth: 340 }]}>
          <GlassCard goldBorder glow>
            <View style={{ padding: Spacing.md + 4 }}>

              {/* Rediscovery badge */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                marginBottom: Spacing.sm,
                backgroundColor: 'rgba(232,168,76,0.08)',
                borderWidth: 1, borderColor: 'rgba(232,168,76,0.2)',
                paddingVertical: 4, paddingHorizontal: 8,
                borderRadius: 2, alignSelf: 'flex-start',
              }}>
                <Text style={{ color: '#E8A84C', fontSize: 9 }}>◉</Text>
                <Text style={{
                  fontFamily: FontFamily.mono, fontSize: 7, color: '#E8A84C',
                  letterSpacing: 0.1, textTransform: 'uppercase',
                }}>
                  Rediscovery #{rediscoveryCount}
                </Text>
              </View>

              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.heading,
                color:         Colors.offWhite,
                letterSpacing: 0.01,
                lineHeight:    36,
                marginBottom:  3,
              }}>
                {artistName}
              </Text>
              <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: Spacing.md }}>
                {ticker}
              </MonoLabel>

              <ScoreBar score={score} color={scoreColor} style={{ marginBottom: Spacing.md }} />

              <View style={{
                borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.08)',
                paddingTop: Spacing.md,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <View>
                  <MonoLabel size="label" color="rgba(255,255,255,0.28)">Still Spotter</MonoLabel>
                  <Text style={{
                    fontFamily: FontFamily.monoBold, fontSize: 24,
                    color: '#E8A84C', letterSpacing: -0.5, marginTop: 2,
                    textShadowColor: '#E8A84C', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
                  }}>
                    #{displayedCount.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <MonoLabel size="label" color="rgba(255,255,255,0.22)">Score</MonoLabel>
                  <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 20, color: Colors.offWhite, letterSpacing: -0.4, marginTop: 2 }}>
                    {score}
                  </Text>
                </View>
              </View>

              {/* REDISCOVERED stamp */}
              <Animated.View style={[stampStyle, {
                borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.08)',
                paddingTop: Spacing.sm, marginTop: Spacing.sm,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }]}>
                <Text style={{ color: '#E8A84C', fontSize: 10 }}>◉</Text>
                <Text style={{
                  fontFamily: FontFamily.mono, fontSize: 7,
                  color: '#E8A84C', letterSpacing: 0.15, textTransform: 'uppercase',
                }}>
                  REDISCOVERED · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </Text>
              </Animated.View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View style={[captionStyle, { marginTop: Spacing.xl, alignItems: 'center' }]}>
          <Text style={{
            fontFamily: FontFamily.serifItalic, fontSize: FontSize.bodyLg + 2,
            color: 'rgba(255,255,255,0.5)', textAlign: 'center',
            letterSpacing: 0.02, lineHeight: 26,
          }}>
            You came back.
          </Text>
          <Text style={{
            fontFamily: FontFamily.mono, fontSize: FontSize.caption,
            color: 'rgba(232,168,76,0.4)', textAlign: 'center',
            letterSpacing: 0.08, marginTop: 6,
          }}>
            Your original call is still on record.
          </Text>
        </Animated.View>

        <Animated.View style={[hintStyle, { position: 'absolute', bottom: 60 }]}>
          <MonoLabel size="label" color="rgba(255,255,255,0.18)">Tap anywhere to continue</MonoLabel>
        </Animated.View>
      </Pressable>

      <SuccessFlare
        visible={showFlare}
        originX={W / 2}
        originY={H * 0.44}
        onComplete={() => setShowFlare(false)}
      />
    </Modal>
  )
}
