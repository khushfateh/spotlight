import { useEffect, useRef, useState } from 'react'
import {
  Dimensions, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withSequence,
  Easing, runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GoldButton from '@/components/ui/GoldButton'
import PremiumInput from '@/components/ui/PremiumInput'
import GoldDivider from '@/components/ui/GoldDivider'
import { useAuth } from '@/context/AuthContext'
import {
  completeOnboarding,
  checkUsernameAvailable,
} from '@/lib/services/profileService'

const { height: H } = Dimensions.get('window')

type Step = 'welcome' | 'username' | 'done'

// ── Availability badge ────────────────────────────────────────────────────────

function AvailabilityBadge({ state }: { state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' }) {
  if (state === 'idle') return null
  const configs = {
    checking:  { label: 'Checking...',  color: 'rgba(255,255,255,0.3)' },
    available: { label: '✓ Available',  color: Colors.success },
    taken:     { label: '✗ Taken',      color: Colors.error },
    invalid:   { label: 'Invalid format', color: Colors.error },
  } as const
  const cfg = configs[state as keyof typeof configs]
  if (!cfg) return null
  return (
    <Text style={{
      fontFamily:    FontFamily.mono,
      fontSize:      FontSize.caption,
      color:         cfg.color,
      letterSpacing: 0.04,
      marginTop:     4,
      marginLeft:    2,
    }}>
      {cfg.label}
    </Text>
  )
}

export default function OnboardingScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const { user, refreshProfile } = useAuth()

  const [step,          setStep]          = useState<Step>('welcome')
  const [username,      setUsername]      = useState('')
  const [availability,  setAvailability]  = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Animation values ──────────────────────────────────────────────────────
  const logoOp     = useSharedValue(0)
  const logoY      = useSharedValue(20)
  const logoS      = useSharedValue(0.8)
  const contentOp  = useSharedValue(0)
  const contentY   = useSharedValue(28)
  const doneIconS  = useSharedValue(0.3)
  const doneIconOp = useSharedValue(0)
  const doneTextOp = useSharedValue(0)

  useEffect(() => {
    logoOp.value = withTiming(1, { duration: 700 })
    logoY.value  = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    logoS.value  = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    contentOp.value = withDelay(300, withTiming(1, { duration: 600 }))
    contentY.value  = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
  }, [])

  const triggerDoneAnim = () => {
    doneIconOp.value = withTiming(1, { duration: 400 })
    doneIconS.value  = withSequence(
      withTiming(1.2, { duration: 420, easing: Easing.out(Easing.back(2.5)) }),
      withSpring(1,   { damping: 14, stiffness: 180 }),
    )
    doneTextOp.value = withDelay(300, withTiming(1, { duration: 480 }))
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  // ── Username availability check (debounced) ───────────────────────────────
  useEffect(() => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current)
    if (!username) { setAvailability('idle'); return }

    const clean = username.trim().toLowerCase()
    const valid = /^[a-z0-9]([a-z0-9_]*[a-z0-9])?$/.test(clean)
      && clean.length >= 3
      && clean.length <= 20
      && !clean.includes('__')

    if (!valid) {
      setAvailability('invalid')
      return
    }

    setAvailability('checking')
    checkTimeout.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(clean)
      setAvailability(available ? 'available' : 'taken')
    }, 400)
  }, [username])

  const handleContinueToUsername = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    contentOp.value = withTiming(0, { duration: 220 }, () => {
      runOnJS(setStep)('username')
      contentOp.value = withDelay(80, withTiming(1, { duration: 380 }))
      contentY.value  = 16
      contentY.value  = withDelay(80, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }))
    })
  }

  const handleSaveUsername = async () => {
    if (!user) return
    if (availability !== 'available') return
    setLoading(true)
    setError(null)
    const result = await completeOnboarding(user.id, username.trim().toLowerCase())
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong')
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      if (result.error?.toLowerCase().includes('taken')) setAvailability('taken')
      return
    }
    await refreshProfile()
    setStep('done')
    triggerDoneAnim()
  }

  const handleEnterApp = () => {
    router.replace('/(tabs)')
  }

  // ── Animated styles ───────────────────────────────────────────────────────
  const logoStyle     = useAnimatedStyle(() => ({
    opacity: logoOp.value, transform: [{ translateY: logoY.value }, { scale: logoS.value }],
  }))
  const contentStyle  = useAnimatedStyle(() => ({
    opacity: contentOp.value, transform: [{ translateY: contentY.value }],
  }))
  const doneIconStyle = useAnimatedStyle(() => ({
    opacity: doneIconOp.value, transform: [{ scale: doneIconS.value }],
  }))
  const doneTextStyle = useAnimatedStyle(() => ({ opacity: doneTextOp.value }))

  // ── DONE step ─────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg }}>
        <Animated.View style={[doneIconStyle, {
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'rgba(201,168,76,0.08)',
          borderWidth: 1.5, borderColor: Colors.brass,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: Spacing.xl,
          shadowColor: Colors.brass, shadowOpacity: 0.5,
          shadowRadius: 32, shadowOffset: { width: 0, height: 0 },
        }]}>
          <Text style={{
            color: Colors.brass, fontSize: 32,
            textShadowColor: Colors.brass, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
          }}>◈</Text>
        </Animated.View>

        <Animated.View style={[doneTextStyle, { alignItems: 'center' }]}>
          <Text style={{
            fontFamily:    FontFamily.serif,
            fontSize:      FontSize.heading,
            color:         Colors.offWhite,
            textAlign:     'center',
            letterSpacing: 0.01,
            marginBottom:  Spacing.sm,
          }}>
            Welcome, @{username}.
          </Text>
          <Text style={{
            fontFamily:    FontFamily.serifItalic,
            fontSize:      FontSize.bodyLg + 2,
            color:         'rgba(255,255,255,0.45)',
            textAlign:     'center',
            letterSpacing: 0.02,
            lineHeight:    26,
            marginBottom:  Spacing.xxl,
          }}>
            Your cultural legacy starts now.{'\n'}
            Spot artists before the world does.
          </Text>
          <GoldButton onPress={handleEnterApp} shimmer style={{ minWidth: 220 }}>
            Enter SPOTLIGHT  ◈
          </GoldButton>
        </Animated.View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.void }}
    >
      {/* Background glow */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.5,
        backgroundColor: 'rgba(201,168,76,0.02)',
        borderBottomLeftRadius: 300, borderBottomRightRadius: 300,
      }} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1, paddingHorizontal: Spacing.lg,
          justifyContent: 'center',
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[logoStyle, { alignItems: 'center', marginBottom: Spacing.xxl }]}>
          <Text style={{
            color: Colors.brass, fontSize: 44, marginBottom: Spacing.md,
            textShadowColor: 'rgba(201,168,76,0.4)',
            textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
          }}>◈</Text>
          <MonoLabel size="label" style={{ marginBottom: Spacing.lg, letterSpacing: 0.6 }}>SPOTLIGHT</MonoLabel>

          {step === 'welcome' && (
            <>
              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.heading,
                color:         Colors.offWhite,
                textAlign:     'center',
                letterSpacing: 0.01,
                marginBottom:  Spacing.sm,
              }}>
                You&apos;re in.
              </Text>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         'rgba(255,255,255,0.32)',
                textAlign:     'center',
                letterSpacing: 0.04,
                lineHeight:    18,
              }}>
                One last step — choose your spotter name.
              </Text>
            </>
          )}

          {step === 'username' && (
            <>
              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.heading,
                color:         Colors.offWhite,
                textAlign:     'center',
                letterSpacing: 0.01,
                marginBottom:  Spacing.sm,
              }}>
                Choose your name.
              </Text>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         'rgba(255,255,255,0.32)',
                textAlign:     'center',
                letterSpacing: 0.04,
                lineHeight:    18,
              }}>
                This is how the world will know you{'\n'}as a cultural discoverer.
              </Text>
            </>
          )}
        </Animated.View>

        {/* Content */}
        <Animated.View style={contentStyle}>
          {step === 'welcome' && (
            <View style={{ gap: Spacing.md }}>
              <GoldDivider />
              {[
                { icon: '◈', title: 'Spot first',   desc: 'Discover artists before they blow up. Your timestamp is permanent.' },
                { icon: '◆', title: 'Build legacy', desc: 'Your vault cards are sealed with the moment you called it.' },
                { icon: '◇', title: 'Get ranked',   desc: 'Spotter #1 of an artist that goes viral? That\'s yours forever.' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm }}>
                  <Text style={{ color: Colors.brass, fontSize: 14, width: 20 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: Colors.offWhite, letterSpacing: 0.04, marginBottom: 3 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.label, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.03, lineHeight: 15 }}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
              <GoldDivider />
              <GoldButton onPress={handleContinueToUsername} fullWidth shimmer style={{ marginTop: Spacing.sm }}>
                Set My Spotter Name  →
              </GoldButton>
            </View>
          )}

          {step === 'username' && (
            <View style={{ gap: Spacing.md }}>
              <View>
                <PremiumInput
                  label="Spotter Name"
                  value={username}
                  onChangeText={v => { setUsername(v); setError(null) }}
                  placeholder="yourname"
                  autoCapitalize="none"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveUsername}
                />
                <AvailabilityBadge state={availability} />
              </View>

              <View style={{ paddingHorizontal: 2, gap: 4 }}>
                {[
                  '3–20 characters',
                  'Letters, numbers, and underscores only',
                  'Must start and end with a letter or digit',
                ].map(rule => (
                  <Text key={rule} style={{
                    fontFamily:    FontFamily.mono,
                    fontSize:      FontSize.label,
                    color:         'rgba(255,255,255,0.22)',
                    letterSpacing: 0.03,
                  }}>
                    · {rule}
                  </Text>
                ))}
              </View>

              {error && (
                <View style={{
                  paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
                  backgroundColor: 'rgba(224,85,85,0.08)',
                  borderLeftWidth: 2, borderLeftColor: Colors.error, borderRadius: 2,
                }}>
                  <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: Colors.error, letterSpacing: 0.04 }}>
                    {error}
                  </Text>
                </View>
              )}

              <GoldButton
                onPress={handleSaveUsername}
                loading={loading}
                disabled={availability !== 'available'}
                fullWidth
                shimmer
                style={{ marginTop: Spacing.sm, opacity: availability === 'available' ? 1 : 0.5 }}
              >
                Claim @{username || 'yourname'}  ◈
              </GoldButton>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
