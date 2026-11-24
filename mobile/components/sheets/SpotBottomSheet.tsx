import { useEffect, useRef, useState } from 'react'
import {
  Dimensions, Modal, Platform, Pressable,
  StyleSheet, Text, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Shadow, Radius } from '@/lib/tokens'
import GoldButton from '@/components/ui/GoldButton'
import GlassCard from '@/components/ui/GlassCard'
import ScoreBar from '@/components/ui/ScoreBar'
import MonoLabel from '@/components/ui/MonoLabel'
import MomentumBadge from '@/components/ui/MomentumBadge'
import SuccessFlare from '@/components/ui/SuccessFlare'
import { useMomentum } from '@/context/MomentumContext'
import { getCreator } from '@/lib/data/creators'
import type { VaultEntry } from '@/lib/hooks/useVault'

const { width: W, height: H } = Dimensions.get('window')

const SPRING = { damping: 26, stiffness: 280, mass: 1 }

type State = 'idle' | 'loading' | 'success' | 'already_spotted' | 'move_on'

type Props = {
  visible:          boolean
  onClose:          () => void
  ticker:           string
  isSpotted:        boolean
  vaultEntry:       VaultEntry | undefined
  onSpot:           () => Promise<{ spotterNumber: number; isRediscovery: boolean } | null>
  onMoveOn:         (durationDays: number) => Promise<void>
  onOpenVault?:     (spotterNumber: number, isRediscovery?: boolean, rediscoveryCount?: number) => void
  onMoveOnComplete?: (durationDays: number) => void
}

const MOVE_ON_OPTIONS = [
  { days: 30,  label: 'Taking a breather',  sub: '30 days' },
  { days: 90,  label: 'Stepping back',      sub: '90 days' },
  { days: 180, label: "It's complicated",   sub: '180 days' },
]

function DragHandle() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(201,168,76,0.22)' }} />
    </View>
  )
}

function ArtistHero({ ticker }: { ticker: string }) {
  const creator = getCreator(ticker)
  const { score, tier } = useMomentum().getScore(ticker)

  return (
    <View style={{ alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
      {/* Avatar */}
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(201,168,76,0.07)',
        borderWidth: 1.5, borderColor: Colors.brass,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
        ...Shadow.goldStrong,
      }}>
        <Text style={{ color: Colors.brass, fontSize: 26 }}>◈</Text>
      </View>

      <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 5 }}>
        {ticker}
      </MonoLabel>
      <Text style={{
        fontFamily:    FontFamily.serif,
        fontSize:      FontSize.heading,
        color:         Colors.offWhite,
        letterSpacing: 0.01,
        textAlign:     'center',
        marginBottom:  4,
      }}>
        {creator?.name ?? ticker}
      </Text>
      <Text style={{
        fontFamily:    FontFamily.mono,
        fontSize:      FontSize.caption,
        color:         'rgba(255,255,255,0.35)',
        letterSpacing: 0.06,
        marginBottom:  Spacing.md,
      }}>
        {creator?.genre ?? '—'}
      </Text>

      <MomentumBadge tier={tier} />
    </View>
  )
}

function StatsRow({ ticker }: { ticker: string }) {
  const creator  = getCreator(ticker)
  const { score } = useMomentum().getScore(ticker)
  const scoreColor = score >= 90 ? Colors.brass : score >= 76 ? Colors.brassLight : Colors.dimWhite

  return (
    <GlassCard goldBorder style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row' }}>
        {[
          { label: 'Score',    value: score },
          { label: 'Spotters', value: (creator?.spotters ?? 0).toLocaleString() },
          { label: 'Rank',     value: '#12' },
        ].map((s, i) => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.md }}>
            {i > 0 && (
              <View style={{
                position: 'absolute', left: 0, top: Spacing.md, bottom: Spacing.md,
                width: 1, backgroundColor: 'rgba(201,168,76,0.08)',
              }} />
            )}
            <Text style={{
              fontFamily:    FontFamily.monoBold,
              fontSize:      22,
              color:         i === 0 ? scoreColor : Colors.offWhite,
              letterSpacing: -0.4,
            }}>
              {s.value}
            </Text>
            <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 3 }}>
              {s.label}
            </MonoLabel>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <ScoreBar score={score} color={scoreColor} height={2} />
      </View>
    </GlassCard>
  )
}

export default function SpotBottomSheet({
  visible, onClose, ticker, isSpotted, vaultEntry, onSpot, onMoveOn, onOpenVault, onMoveOnComplete,
}: Props) {
  const insets = useSafeAreaInsets()

  const [state,           setState]          = useState<State>('idle')
  const [spotterNumber,   setSpotterNumber]  = useState<number | null>(null)
  const [displayedCount,  setDisplayedCount] = useState(0)
  const [showFlare,       setShowFlare]      = useState(false)
  const [moveOnLoading,   setMoveOnLoading]  = useState(false)
  const [isRediscovery,   setIsRediscovery]  = useState(false)
  const [rediscoveryCount, setRediscoveryCount] = useState(1)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animation values
  const sheetY      = useSharedValue(600)
  const backdropOp  = useSharedValue(0)
  const idleOp      = useSharedValue(1)
  const successOp   = useSharedValue(0)
  const successIconS = useSharedValue(0)
  const successIconOp = useSharedValue(0)
  const moveOnOp    = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setState(isSpotted ? 'already_spotted' : 'idle')
      idleOp.value    = 1
      successOp.value = 0
      moveOnOp.value  = 0
      sheetY.value     = withSpring(0, SPRING)
      backdropOp.value = withTiming(1, { duration: 280 })
    } else {
      sheetY.value     = withSpring(620, SPRING)
      backdropOp.value = withTiming(0, { duration: 220 })
      setTimeout(() => {
        setState('idle')
        setSpotterNumber(null)
        setDisplayedCount(0)
        setShowFlare(false)
        setIsRediscovery(false)
        setRediscoveryCount(1)
        idleOp.value    = 1
        successOp.value = 0
        moveOnOp.value  = 0
      }, 350)
    }
  }, [visible, isSpotted])

  // Spotter number count-up animation (JS thread)
  useEffect(() => {
    if (spotterNumber === null) return
    if (countRef.current) clearInterval(countRef.current)
    let count = Math.max(1, spotterNumber - 40)
    setDisplayedCount(count)
    countRef.current = setInterval(() => {
      count = Math.min(count + 3, spotterNumber)
      setDisplayedCount(count)
      if (count >= spotterNumber) clearInterval(countRef.current!)
    }, 20)
    return () => { if (countRef.current) clearInterval(countRef.current) }
  }, [spotterNumber])

  const handleSpot = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setState('loading')

    const result = await onSpot()

    const isRedisc     = result?.isRediscovery ?? false
    const rediscCount  = isRedisc ? (vaultEntry?.rediscoveryCount ?? 0) + 1 : 1
    setIsRediscovery(isRedisc)
    setRediscoveryCount(rediscCount)

    // Transition to success
    idleOp.value = withTiming(0, { duration: 220 })
    successOp.value = withDelay(200, withTiming(1, { duration: 380 }))
    successIconS.value = withDelay(300,
      withSequence(
        withTiming(1.14, { duration: 320, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, { damping: 14, stiffness: 200 }),
      ),
    )
    successIconOp.value = withDelay(280, withTiming(1, { duration: 300 }))
    setState('success')
    setSpotterNumber(result?.spotterNumber ?? null)
    setShowFlare(true)

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const handleMoveOn = async (days: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setMoveOnLoading(true)
    await onMoveOn(days)
    setMoveOnLoading(false)
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    onClose()
    if (onMoveOnComplete) {
      setTimeout(() => onMoveOnComplete(days), 320)
    }
  }

  const toMoveOn = () => {
    moveOnOp.value = withTiming(1, { duration: 240 })
    setState('move_on')
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  // ── Animated styles ──────────────────────────────────────────────────────
  const backdropStyle  = useAnimatedStyle(() => ({ opacity: backdropOp.value }))
  const sheetStyle     = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }))
  const idleStyle    = useAnimatedStyle(() => ({ opacity: idleOp.value }))
  const successStyle = useAnimatedStyle(() => ({ opacity: successOp.value }))
  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successIconS.value }],
    opacity:   successIconOp.value,
  }))
  const moveOnStyle = useAnimatedStyle(() => ({ opacity: moveOnOp.value }))

  const { score, tier } = useMomentum().getScore(ticker)
  const creator         = getCreator(ticker)

  const spotDate = vaultEntry
    ? vaultEntry.spotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'rgba(0,0,0,0.72)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]} pointerEvents="box-none">
        <Animated.View style={[sheetStyle, {
          backgroundColor:   '#080810',
          borderTopLeftRadius:  20,
          borderTopRightRadius: 20,
          borderTopWidth:    1,
          borderLeftWidth:   1,
          borderRightWidth:  1,
          borderColor:       'rgba(201,168,76,0.22)',
          paddingBottom:     insets.bottom + Spacing.lg,
          overflow:          'hidden',
          // Top gold line
        }]}>
          {/* Top gold shimmer line */}
          <View style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.18)', marginHorizontal: 60 }} />

          <DragHandle />

          {/* ── IDLE / ALREADY SPOTTED state ─────────────────────────── */}
          {(state === 'idle' || state === 'loading' || state === 'already_spotted') && (
            <Animated.View style={idleStyle}>

              {state !== 'already_spotted' && (
                <>
                  <ArtistHero ticker={ticker} />
                  <StatsRow   ticker={ticker} />

                  {/* Spotter CTA line */}
                  <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                    <Text style={{
                      fontFamily:    FontFamily.mono,
                      fontSize:      FontSize.caption,
                      color:         'rgba(255,255,255,0.45)',
                      letterSpacing: 0.04,
                      textAlign:     'center',
                      lineHeight:    18,
                    }}>
                      You'd be Spotter #{((creator?.spotters ?? 0) + 1).toLocaleString()}
                      {'\n'}
                      <Text style={{ color: Colors.brass }}>Founding window is open</Text>
                    </Text>
                  </View>

                  <View style={{ paddingHorizontal: Spacing.lg }}>
                    <GoldButton
                      onPress={handleSpot}
                      fullWidth
                      shimmer
                      disabled={state === 'loading'}
                      style={{ opacity: state === 'loading' ? 0.6 : 1 }}
                    >
                      {state === 'loading' ? 'Confirming...' : `Spot ${creator?.name ?? ticker} ◈`}
                    </GoldButton>
                  </View>
                </>
              )}

              {state === 'already_spotted' && (
                <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
                  {/* Already spotted header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, justifyContent: 'center' }}>
                    <Text style={{ color: Colors.brass, fontSize: 18 }}>◈</Text>
                    <Text style={{
                      fontFamily:    FontFamily.serif,
                      fontSize:      FontSize.title,
                      color:         Colors.offWhite,
                      letterSpacing: 0.01,
                    }}>
                      Already in your vault
                    </Text>
                  </View>

                  {/* Vault card preview */}
                  <GlassCard goldBorder glow style={{ marginBottom: Spacing.md }}>
                    <View style={{ padding: Spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
                        <View>
                          <Text style={{
                            fontFamily:    FontFamily.serif,
                            fontSize:      FontSize.title,
                            color:         Colors.offWhite,
                            letterSpacing: 0.01,
                          }}>
                            {creator?.name ?? ticker}
                          </Text>
                          {spotDate && (
                            <MonoLabel size="label" color="rgba(255,255,255,0.28)" style={{ marginTop: 3 }}>
                              Spotted {spotDate}
                            </MonoLabel>
                          )}
                          {vaultEntry?.isFoundingSpot && (
                            <MonoLabel size="label" color={Colors.brass} style={{ marginTop: 4 }}>
                              ◈ Founding Spotter #{vaultEntry.spotterRank}
                            </MonoLabel>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{
                            fontFamily:    FontFamily.monoBold,
                            fontSize:      28,
                            color:         Colors.offWhite,
                            letterSpacing: -0.5,
                          }}>
                            {score}
                          </Text>
                          <MonoLabel size="label" color={Colors.brass}>Score</MonoLabel>
                        </View>
                      </View>
                      <ScoreBar score={score} height={2} />
                    </View>
                  </GlassCard>

                  <View style={{ alignSelf: 'center', marginBottom: Spacing.lg }}>
                    <MomentumBadge tier={tier} />
                  </View>

                  <View style={{ gap: Spacing.sm }}>
                    <GoldButton onPress={toMoveOn} variant="outline" fullWidth>
                      Move On  ·  Close this chapter →
                    </GoldButton>
                    <GoldButton onPress={onClose} variant="ghost" fullWidth>
                      I&apos;ll stay spotted
                    </GoldButton>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── SUCCESS state ────────────────────────────────────────── */}
          {state === 'success' && (
            <Animated.View style={[successStyle, { paddingHorizontal: Spacing.lg, alignItems: 'center', paddingTop: Spacing.md }]}>
              {/* Big ◈ */}
              <Animated.View style={[successIconStyle, {
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(201,168,76,0.08)',
                borderWidth: 1.5, borderColor: Colors.brass,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: Spacing.md,
                ...Shadow.goldStrong,
              }]}>
                <Text style={{
                  color:    Colors.brass,
                  fontSize: 32,
                  textShadowColor: Colors.brass,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 16,
                }}>◈</Text>
              </Animated.View>

              <Text style={{
                fontFamily:    FontFamily.serifItalic,
                fontSize:      FontSize.heading,
                color:         Colors.offWhite,
                marginBottom:  6,
                letterSpacing: 0.02,
              }}>
                Spotted.
              </Text>

              {spotterNumber !== null ? (
                <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
                  <Text style={{
                    fontFamily:    FontFamily.mono,
                    fontSize:      FontSize.caption,
                    color:         'rgba(255,255,255,0.45)',
                    letterSpacing: 0.06,
                    marginBottom:  4,
                  }}>
                    You are
                  </Text>
                  <Text style={{
                    fontFamily:    FontFamily.monoBold,
                    fontSize:      36,
                    color:         Colors.brass,
                    letterSpacing: -0.5,
                    textShadowColor: Colors.brass,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 12,
                  }}>
                    Spotter #{displayedCount.toLocaleString()}
                  </Text>
                </View>
              ) : (
                <Text style={{
                  fontFamily:    FontFamily.mono,
                  fontSize:      FontSize.caption,
                  color:         'rgba(255,255,255,0.4)',
                  marginBottom:  Spacing.lg,
                  letterSpacing: 0.06,
                  textAlign:     'center',
                }}>
                  Your discovery is now on record.{'\n'}
                  <Text style={{ color: Colors.brassDim }}>Check your vault for the full card.</Text>
                </Text>
              )}

              {/* Vault card preview */}
              <GlassCard goldBorder glow style={{ width: '100%', marginBottom: Spacing.lg }}>
                <View style={{ padding: Spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{
                        fontFamily:    FontFamily.serif,
                        fontSize:      FontSize.bodyLg,
                        color:         Colors.offWhite,
                        letterSpacing: 0.01,
                      }}>
                        {creator?.name ?? ticker}
                      </Text>
                      <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 3 }}>
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </MonoLabel>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontFamily:    FontFamily.monoBold,
                        fontSize:      22,
                        color:         Colors.offWhite,
                        letterSpacing: -0.4,
                      }}>
                        {score}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: Spacing.sm }}>
                    <ScoreBar score={score} height={2} />
                  </View>
                </View>
              </GlassCard>

              <GoldButton
                onPress={() => {
                  onClose()
                  if (onOpenVault && spotterNumber !== null) {
                    setTimeout(() => onOpenVault(spotterNumber, isRediscovery, rediscoveryCount), 320)
                  }
                }}
                fullWidth
                shimmer
                effect="crack"
              >
                {isRediscovery ? 'Open Vault Card  ◉' : 'Open Vault Card  ◈'}
              </GoldButton>
            </Animated.View>
          )}

          {/* ── MOVE ON state ────────────────────────────────────────── */}
          {state === 'move_on' && (
            <Animated.View style={[moveOnStyle, { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }]}>
              <View style={{ marginBottom: Spacing.lg, paddingTop: Spacing.sm }}>
                <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 6, textAlign: 'center' }}>
                  Moving on from
                </MonoLabel>
                <Text style={{
                  fontFamily:    FontFamily.serif,
                  fontSize:      FontSize.heading,
                  color:         Colors.offWhite,
                  textAlign:     'center',
                  letterSpacing: 0.01,
                }}>
                  {creator?.name ?? ticker}
                </Text>
              </View>

              <MonoLabel size="label" color="rgba(255,255,255,0.35)" style={{ marginBottom: Spacing.md, textAlign: 'center' }}>
                How long are you stepping back?
              </MonoLabel>

              <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
                {MOVE_ON_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.days}
                    onPress={() => handleMoveOn(opt.days)}
                    disabled={moveOnLoading}
                    style={({ pressed }) => ({
                      flexDirection:   'row',
                      alignItems:      'center',
                      justifyContent:  'space-between',
                      paddingVertical:  Spacing.md,
                      paddingHorizontal: Spacing.md,
                      borderRadius:    Radius.sharp,
                      borderWidth:     1,
                      borderColor:     pressed ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.14)',
                      backgroundColor: pressed ? 'rgba(201,168,76,0.08)' : 'rgba(7,5,13,0.6)',
                      opacity:         moveOnLoading ? 0.5 : 1,
                    })}
                  >
                    <Text style={{
                      fontFamily:    FontFamily.serif,
                      fontSize:      FontSize.bodyLg,
                      color:         Colors.offWhite,
                      letterSpacing: 0.01,
                    }}>
                      {opt.label}
                    </Text>
                    <MonoLabel size="label" color={Colors.brassDim}>{opt.sub}</MonoLabel>
                  </Pressable>
                ))}
              </View>

              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.label,
                color:         'rgba(255,255,255,0.28)',
                textAlign:     'center',
                lineHeight:    18,
                letterSpacing: 0.06,
                marginBottom:  Spacing.md,
              }}>
                Your discovery stays in the vault forever.{'\n'}You can always come back.
              </Text>

              <GoldButton onPress={onClose} variant="ghost" fullWidth>
                Cancel
              </GoldButton>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* SuccessFlare — above everything */}
      <SuccessFlare
        visible={showFlare}
        originX={W / 2}
        originY={H * 0.38}
        onComplete={() => setShowFlare(false)}
      />
    </Modal>
  )
}
