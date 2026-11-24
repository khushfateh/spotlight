import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors, FontFamily } from '@/lib/tokens'

export default function AuthCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    token_hash?:    string
    type?:          string
    access_token?:  string
    refresh_token?: string
  }>()

  useEffect(() => {
    const handle = async () => {
      try {
        const { token_hash, type, access_token, refresh_token } = params

        if (token_hash && type) {
          // Magic link / email OTP: spotlight://auth/callback?token_hash=...&type=signup|magiclink
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
          })
          if (error) throw error
        } else if (access_token && refresh_token) {
          // OAuth: tokens arrive as URL params
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) throw error
        }
        // NavigationGuard in _layout handles onboarding redirect if needed
        router.replace('/(tabs)')
      } catch {
        router.replace('/auth/login')
      }
    }
    handle()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        color: Colors.brass, fontSize: 36, marginBottom: 20,
        textShadowColor: Colors.brass,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
      }}>◈</Text>
      <Text style={{
        fontFamily:    FontFamily.mono,
        fontSize:      9,
        color:         'rgba(255,255,255,0.28)',
        letterSpacing: 0.15,
        textTransform: 'uppercase',
      }}>
        Signing in...
      </Text>
    </View>
  )
}
