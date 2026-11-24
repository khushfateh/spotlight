// MoveOnCinematic — archival, closure tone. Cool palette, not gold.
// Triggered after the user selects a move-on duration.

import { useEffect } from 'react'
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withSequence, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Shadow } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'

const { width: W } = Dimensions.get('window')

export type MoveOnCinematicProps = {
  visible:     boolean
  onDismiss:   () => void
  artistName:  string
  ticker:      string
  durationDays: number
  spotterRank: number
}

export default function MoveOnCinematic({
  visible, onDismiss, artistName, ticker, durationDays, spotterRank,
}: MoveOnCinematicProps) {
  const bgOp      = useSharedValue(0)
  const iconOp    = useSharedValue(0)
  const iconS     = useSharedValue(1.2)
  const cardOp    = useSharedValue(0)
  const cardY     = useSharedValue(24)
  const stampOp   = useSharedValue(0)
  const stampS    = useSharedValue(1.1)
  const captionOp = useSharedValue(0)
  const hintOp    = useSharedValue(0)

  const durationLabel = durationDays === 30 ? '30 days' : durationDays === 90 ? '90 days' : '180 days'
  const returnDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    if (!visible) {
      bgOp.value = iconOp.value = cardOp.value = stampOp.value = captionOp.value = hintOp.value = 0
      iconS.value = 1.2; cardY.value = 24; stampS.value = 1.1
      return
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    bgOp.value   = withTiming(1, { duration: 380 })
    iconOp.value = withDelay(200, withTiming(1, { duration: 340 }))
    iconS.value  = withDelay(200, withSpring(1, { damping: 16, stiffness: 160 }))
    cardOp.value = withDelay(500, withTiming(1, { duration: 480 }))
    cardY.value  = withDelay(500, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }))

    stampOp.value = withDelay(1200, withTiming(1, { duration: 300 }))
    stampS.value  = withDelay(1200,
      withSequence(
        withTiming(0.94, { duration: 180 }),
        withSpring(1, { damping: 20, stiffness: 320 }),
      ),
    )
    captionOp.value = withDelay(1600, withTiming(1, { duration: 480 }))
    hintOp.value    = withDelay(2600, withTiming(1, { duration: 600 }))
  }, [visible])

  const bgStyle      = useAnimatedStyle(() => ({ opacity: bgOp.value }))
  const iconStyle    = useAnimatedStyle(() => ({ opacity: iconOp.value, transform: [{ scale: iconS.value }] }))
  const cardStyle    = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }))
  const stampStyle   = useAnimatedStyle(() => ({ opacity: stampOp.value, transform: [{ scale: stampS.value }] }))
  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOp.value }))
  const hintStyle    = useAnimatedStyle(() => ({ opacity: hintOp.value }))

  if (!visible) return null

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      {/* Background — cool steel tone, not gold */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle, { backgroundColor: 'rgba(3,4,8,0.97)' }]} />

      {/* Subtle blue-grey ambient */}
      <View pointerEvents="none" style={{
        position: 'absolute',
        width: W, height: W, left: 0, top: '25%',
        borderRadius: W / 2,
        backgroundColor: 'rgba(96,165,250,0)',
        shadowColor: 'rgba(148,163,184,1)',
        shadowOpacity: 0.12, shadowRadius: 120,
        shadowOffset: { width: 0, height: 0 },
      }} />

      <Pressable
        style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg }]}
        onPress={onDismiss}
      >
        {/* Archive icon */}
        <Animated.View style={[iconStyle, {
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: 'rgba(148,163,184,0.06)',
          borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: Spacing.lg,
        }]}>
          <Text style={{ color: 'rgba(148,163,184,0.7)', fontSize: 22 }}>◇</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[cardStyle, { width: '100%', maxWidth: 340 }]}>
          <GlassCard style={{ borderColor: 'rgba(148,163,184,0.15)' }}>
            <View style={{ padding: Spacing.md + 4 }}>

              {/* Artist */}
              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.heading,
                color:         'rgba(255,255,255,0.65)',
                letterSpacing: 0.01,
                lineHeight:    36,
                marginBottom:  3,
              }}>
                {artistName}
              </Text>
              <MonoLabel size="label" color="rgba(255,255,255,0.22)" style={{ marginBottom: Spacing.md }}>
                {ticker}
              </MonoLabel>

              <View style={{ height: 1, backgroundColor: 'rgba(148,163,184,0.08)', marginBottom: Spacing.md }} />

              {/* Stats */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <View>
                  <MonoLabel size="label" color="rgba(255,255,255,0.22)">Your spotter rank</MonoLabel>
                  <Text style={{
                    fontFamily:    FontFamily.monoBold,
                    fontSize:      18,
                    color:         'rgba(255,255,255,0.45)',
                    letterSpacing: -0.4,
                    marginTop:     2,
                  }}>
                    #{spotterRank > 0 ? spotterRank.toLocaleString() : '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <MonoLabel size="label" color="rgba(255,255,255,0.22)">Duration</MonoLabel>
                  <Text style={{
                    fontFamily:    FontFamily.mono,
                    fontSize:      FontSize.caption,
                    color:         'rgba(255,255,255,0.4)',
                    marginTop:     2,
                  }}>
                    {durationLabel}
                  </Text>
                </View>
              </View>

              {/* ARCHIVED stamp */}
              <Animated.View style={[stampStyle, {
                borderTopWidth: 1,
                borderTopColor: 'rgba(148,163,184,0.08)',
                paddingTop: Spacing.sm,
                marginTop: Spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }]}>
                <Text style={{ color: 'rgba(148,163,184,0.4)', fontSize: 10 }}>◇</Text>
                <Text style={{
                  fontFamily:    FontFamily.mono,
                  fontSize:      7,
                  color:         'rgba(148,163,184,0.45)',
                  letterSpacing: 0.15,
                  textTransform: 'uppercase',
                }}>
                  ARCHIVED · Returns {returnDate.toUpperCase()}
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
            color:         'rgba(255,255,255,0.4)',
            textAlign:     'center',
            letterSpacing: 0.02,
            lineHeight:    26,
          }}>
            Chapter closed.
          </Text>
          <Text style={{
            fontFamily:    FontFamily.mono,
            fontSize:      FontSize.caption,
            color:         'rgba(255,255,255,0.2)',
            textAlign:     'center',
            letterSpacing: 0.08,
            marginTop:     6,
          }}>
            Your discovery stays in the vault.{'\n'}You can always come back.
          </Text>
        </Animated.View>

        <Animated.View style={[hintStyle, { position: 'absolute', bottom: 60 }]}>
          <MonoLabel size="label" color="rgba(255,255,255,0.14)">Tap anywhere to continue</MonoLabel>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
