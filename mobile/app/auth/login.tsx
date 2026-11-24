import { useState, useEffect } from 'react'
import {
  View, Text, Pressable, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GoldButton from '@/components/ui/GoldButton'
import PremiumInput from '@/components/ui/PremiumInput'

export default function LoginScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Entry animations
  const logoScale  = useSharedValue(0.7)
  const logoOp     = useSharedValue(0)
  const contentOp  = useSharedValue(0)
  const contentY   = useSharedValue(28)

  useEffect(() => {
    logoScale.value  = withTiming(1,  { duration: 700, easing: Easing.out(Easing.cubic) })
    logoOp.value     = withTiming(1,  { duration: 600 })
    contentOp.value  = withDelay(200, withTiming(1, { duration: 600 }))
    contentY.value   = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
  }, [])

  const logoStyle    = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }))
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOp.value, transform: [{ translateY: contentY.value }] }))

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      setError(error.message)
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.void }}
    >
      {/* Top glow */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 240,
        backgroundColor: 'rgba(201,168,76,0.03)',
        borderBottomLeftRadius: 200,
        borderBottomRightRadius: 200,
      }} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.lg,
          justifyContent: 'center',
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close */}
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + Spacing.md, right: Spacing.lg }}
          hitSlop={8}
        >
          <Text style={{ color: 'rgba(255,255,255,0.28)', fontSize: 24, lineHeight: 28 }}>×</Text>
        </Pressable>

        {/* Logo */}
        <Animated.View style={[logoStyle, { alignItems: 'center', marginBottom: Spacing.xxl }]}>
          <Text style={{
            color:      Colors.brass,
            fontSize:   40,
            marginBottom: 8,
            textShadowColor: 'rgba(201,168,76,0.4)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 16,
          }}>
            ◈
          </Text>
          <MonoLabel size="label" style={{ marginBottom: Spacing.lg, letterSpacing: 0.6 }}>
            SPOTLIGHT
          </MonoLabel>
          <Text style={{
            fontFamily: FontFamily.serif,
            fontSize:   FontSize.heading,
            color:      Colors.offWhite,
            textAlign:  'center',
            letterSpacing: 0.01,
            marginBottom: 8,
          }}>
            Welcome back.
          </Text>
          <Text style={{
            fontFamily:    FontFamily.mono,
            fontSize:      FontSize.caption,
            color:         'rgba(255,255,255,0.32)',
            textAlign:     'center',
            letterSpacing: 0.04,
            lineHeight:    18,
          }}>
            Sign in to access your vault and discoveries.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[contentStyle, { gap: Spacing.md }]}>
          <PremiumInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          <PremiumInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error && (
            <View style={{
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              backgroundColor: 'rgba(224,85,85,0.08)',
              borderLeftWidth: 2,
              borderLeftColor: Colors.error,
              borderRadius: 2,
            }}>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         Colors.error,
                letterSpacing: 0.04,
              }}>
                {error}
              </Text>
            </View>
          )}

          <GoldButton
            onPress={handleLogin}
            loading={loading}
            fullWidth
            shimmer
            style={{ marginTop: Spacing.sm }}
          >
            Sign In →
          </GoldButton>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm }}>
            <Text style={{
              fontFamily:    FontFamily.mono,
              fontSize:      FontSize.caption,
              color:         'rgba(255,255,255,0.28)',
              letterSpacing: 0.04,
            }}>
              New to SPOTLIGHT?
            </Text>
            <Pressable onPress={() => router.replace('/auth/signup')}>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         Colors.brass,
                letterSpacing: 0.04,
              }}>
                Join ◈
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
