import { useState } from 'react'
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { supabase } from '@/lib/supabase'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GoldButton from '@/components/ui/GoldButton'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      setError(error.message)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.void }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center', paddingBottom: insets.bottom + Spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close */}
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + Spacing.md, right: Spacing.lg }}>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 24 }}>×</Text>
        </Pressable>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xxl }}>
          <Text style={{ color: Colors.brass, fontSize: 32, marginBottom: Spacing.sm }}>◈</Text>
          <MonoLabel size="label" style={{ marginBottom: Spacing.lg }}>SPOTLIGHT</MonoLabel>
          <SerifHeading size="heading" style={{ textAlign: 'center', marginBottom: Spacing.sm }}>
            Welcome back.
          </SerifHeading>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: 0.04 }}>
            Sign in to access your vault and discoveries.
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: Spacing.md }}>
          {[
            { label: 'Email', value: email, setter: setEmail, placeholder: 'you@example.com', type: 'email-address' as const, secure: false },
            { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', type: 'default' as const, secure: true },
          ].map(field => (
            <View key={field.label}>
              <MonoLabel size="label" style={{ marginBottom: 7 }}>{field.label}</MonoLabel>
              <TextInput
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor="rgba(255,255,255,0.22)"
                keyboardType={field.type}
                secureTextEntry={field.secure}
                autoCapitalize="none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                  borderRadius: Radius.sharp,
                  paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
                  fontFamily: FontFamily.mono, fontSize: FontSize.caption,
                  color: Colors.offWhite,
                }}
              />
            </View>
          ))}

          {error && (
            <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: Colors.error, letterSpacing: 0.04 }}>
              {error}
            </Text>
          )}

          <GoldButton onPress={handleLogin} loading={loading} fullWidth style={{ marginTop: Spacing.sm }}>
            Sign In →
          </GoldButton>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.sm }}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.04 }}>
              New to SPOTLIGHT?
            </Text>
            <Pressable onPress={() => router.replace('/auth/signup')}>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: Colors.brass, letterSpacing: 0.04 }}>
                Join ◈
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
