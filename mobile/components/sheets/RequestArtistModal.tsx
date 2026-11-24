import { useEffect, useState } from 'react'
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
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
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '@/lib/tokens'
import GoldButton from '@/components/ui/GoldButton'
import MonoLabel from '@/components/ui/MonoLabel'
import { submitArtistRequest } from '@/lib/services/artistRequestService'
import { useAuth } from '@/context/AuthContext'

const SPRING = { damping: 26, stiffness: 280, mass: 1 }

const GENRE_CHIPS = [
  'Pop', 'Hip-Hop', 'R&B', 'K-Pop', 'Punjabi', 'Afrobeats',
  'Latin', 'Electronic', 'Folk', 'Indie', 'Classical', 'Other',
]

type Props = {
  visible:      boolean
  onClose:      () => void
  initialQuery?: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

function DragHandle() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(201,168,76,0.22)' }} />
    </View>
  )
}

export default function RequestArtistModal({ visible, onClose, initialQuery = '' }: Props) {
  const insets    = useSafeAreaInsets()
  const { user }  = useAuth()

  const [artistName, setArtistName]   = useState(initialQuery)
  const [genre,      setGenre]        = useState<string | null>(null)
  const [reason,     setReason]       = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg,   setErrorMsg]     = useState('')

  const sheetY      = useSharedValue(600)
  const backdropOp  = useSharedValue(0)
  const successIconS = useSharedValue(0)
  const successOp   = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setArtistName(initialQuery)
      setGenre(null)
      setReason('')
      setSubmitState('idle')
      setErrorMsg('')
      sheetY.value     = withSpring(0, SPRING)
      backdropOp.value = withTiming(1, { duration: 280 })
    } else {
      sheetY.value     = withSpring(620, SPRING)
      backdropOp.value = withTiming(0, { duration: 220 })
    }
  }, [visible, initialQuery])

  const handleSubmit = async () => {
    if (!artistName.trim()) {
      setErrorMsg('Please enter an artist name.')
      return
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSubmitState('loading')
    setErrorMsg('')

    const result = await submitArtistRequest({
      userId:    user?.id    ?? 'anonymous',
      userEmail: user?.email ?? '',
      name:      artistName.trim(),
      genre:     genre  || undefined,
      reason:    reason || undefined,
    })

    if (!result.ok) {
      if (result.error === 'already_requested') {
        setSubmitState('success')
      } else {
        setSubmitState('error')
        setErrorMsg(result.error ?? 'Something went wrong. Try again.')
      }
      return
    }

    // Success
    setSubmitState('success')
    successIconS.value = withDelay(100,
      withSequence(
        withTiming(1.12, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, { damping: 14 }),
      ),
    )
    successOp.value = withTiming(1, { duration: 380 })
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }))
  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }))
  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successIconS.value }],
    opacity:   successOp.value,
  }))

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: 'rgba(0,0,0,0.72)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); onClose() }} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[sheetStyle, {
          backgroundColor:      '#080810',
          borderTopLeftRadius:  20,
          borderTopRightRadius: 20,
          borderTopWidth:       1,
          borderLeftWidth:      1,
          borderRightWidth:     1,
          borderColor:          'rgba(201,168,76,0.22)',
          maxHeight:            '90%',
          overflow:             'hidden',
        }]}>
          <View style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.18)', marginHorizontal: 60 }} />
          <DragHandle />

          {submitState === 'success' ? (
            /* ── Success state ── */
            <View style={{
              alignItems: 'center',
              paddingHorizontal: Spacing.lg,
              paddingBottom: insets.bottom + Spacing.xl,
              paddingTop: Spacing.md,
            }}>
              <Animated.View style={[successIconStyle, {
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: 'rgba(201,168,76,0.08)',
                borderWidth: 1.5, borderColor: Colors.brass,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: Spacing.md,
                ...Shadow.goldStrong,
              }]}>
                <Text style={{ color: Colors.brass, fontSize: 28 }}>◇</Text>
              </Animated.View>

              <Text style={{
                fontFamily:    FontFamily.serifItalic,
                fontSize:      FontSize.heading,
                color:         Colors.offWhite,
                marginBottom:  8,
                textAlign:     'center',
              }}>
                Request sent.
              </Text>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         'rgba(255,255,255,0.4)',
                textAlign:     'center',
                lineHeight:    20,
                letterSpacing: 0.04,
                marginBottom:  Spacing.xl,
              }}>
                We'll review <Text style={{ color: Colors.brassDim }}>{artistName}</Text>{'\n'}
                and reach out when they're on SPOTLIGHT.
              </Text>
              <GoldButton onPress={onClose} shimmer>
                Back to Discover
              </GoldButton>
            </View>
          ) : (
            /* ── Form state ── */
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing.lg,
                paddingBottom: insets.bottom + Spacing.xl,
              }}
            >
              {/* Header */}
              <View style={{ marginBottom: Spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 }}>
                  <Text style={{ color: 'rgba(201,168,76,0.4)', fontSize: 18 }}>◇</Text>
                  <Text style={{
                    fontFamily:    FontFamily.serif,
                    fontSize:      FontSize.title,
                    color:         Colors.offWhite,
                    letterSpacing: 0.01,
                  }}>
                    Request an Artist
                  </Text>
                </View>
                <Text style={{
                  fontFamily:    FontFamily.mono,
                  fontSize:      FontSize.caption,
                  color:         'rgba(255,255,255,0.32)',
                  letterSpacing: 0.04,
                  lineHeight:    18,
                }}>
                  Found someone who deserves to be on SPOTLIGHT?{'\n'}Tell us — your taste shapes the catalog.
                </Text>
              </View>

              {/* Artist Name */}
              <View style={{ marginBottom: Spacing.md }}>
                <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 7 }}>
                  Artist / Creator Name *
                </MonoLabel>
                <View style={{
                  flexDirection:     'row',
                  alignItems:        'center',
                  backgroundColor:   'rgba(7,5,13,0.72)',
                  borderWidth:       1,
                  borderColor:       artistName ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.14)',
                  borderRadius:      Radius.sharp,
                  paddingHorizontal: Spacing.md,
                  paddingVertical:   Spacing.sm + 3,
                }}>
                  <TextInput
                    value={artistName}
                    onChangeText={setArtistName}
                    placeholder="e.g. Karan Aujla, Billie Eilish..."
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={{
                      flex:          1,
                      fontFamily:    FontFamily.mono,
                      fontSize:      FontSize.caption,
                      color:         Colors.offWhite,
                      letterSpacing: 0.02,
                      padding:       0,
                    }}
                  />
                </View>
              </View>

              {/* Genre chips */}
              <View style={{ marginBottom: Spacing.lg }}>
                <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 10 }}>
                  Genre  (optional)
                </MonoLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {GENRE_CHIPS.map(g => {
                    const active = genre === g
                    return (
                      <Pressable
                        key={g}
                        onPress={() => {
                          setGenre(active ? null : g)
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        }}
                        style={{
                          paddingVertical:   4,
                          paddingHorizontal: 10,
                          borderRadius:      Radius.sharp,
                          borderWidth:       1,
                          borderColor:       active ? Colors.brass : 'rgba(255,255,255,0.1)',
                          backgroundColor:   active ? 'rgba(201,168,76,0.12)' : 'rgba(7,5,13,0.6)',
                        }}
                      >
                        <Text style={{
                          fontFamily:    FontFamily.mono,
                          fontSize:      8,
                          letterSpacing: 0.08,
                          textTransform: 'uppercase',
                          color:         active ? Colors.brass : 'rgba(255,255,255,0.35)',
                        }}>
                          {g}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Reason */}
              <View style={{ marginBottom: Spacing.lg }}>
                <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 7 }}>
                  Why SPOTLIGHT?  (optional)
                </MonoLabel>
                <View style={{
                  backgroundColor:   'rgba(7,5,13,0.72)',
                  borderWidth:       1,
                  borderColor:       reason ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.14)',
                  borderRadius:      Radius.sharp,
                  paddingHorizontal: Spacing.md,
                  paddingVertical:   Spacing.sm + 3,
                }}>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="What makes them special? Why now?"
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    multiline
                    numberOfLines={3}
                    style={{
                      fontFamily:    FontFamily.mono,
                      fontSize:      FontSize.caption,
                      color:         Colors.offWhite,
                      letterSpacing: 0.02,
                      padding:       0,
                      minHeight:     60,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
              </View>

              {/* Error */}
              {errorMsg ? (
                <View style={{
                  borderLeftWidth: 2, borderLeftColor: Colors.error,
                  paddingLeft: Spacing.md, marginBottom: Spacing.md,
                }}>
                  <Text style={{
                    fontFamily:    FontFamily.mono,
                    fontSize:      FontSize.caption,
                    color:         Colors.error,
                    letterSpacing: 0.04,
                  }}>
                    {errorMsg}
                  </Text>
                </View>
              ) : null}

              <GoldButton
                onPress={handleSubmit}
                fullWidth
                shimmer
                disabled={submitState === 'loading'}
                style={{ opacity: submitState === 'loading' ? 0.6 : 1 }}
              >
                {submitState === 'loading' ? 'Sending...' : 'Submit Request ◇'}
              </GoldButton>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
