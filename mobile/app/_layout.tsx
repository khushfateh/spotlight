import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MomentumProvider } from '@/context/MomentumContext'
import { Colors } from '@/lib/tokens'
import { supabase } from '@/lib/supabase'

// ── Push notification global handler ──────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  false,
    shouldSetBadge:   true,
  }),
})

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SPOTLIGHT',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  try {
    const projectId = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.eas as { projectId?: string } | undefined
    const token = (await Notifications.getExpoPushTokenAsync(
      projectId?.projectId ? { projectId: projectId.projectId } : undefined
    )).data
    return token
  } catch {
    return null
  }
}

// ── Navigation guard ───────────────────────────────────────────────────────────

function NavigationGuard() {
  const { needsOnboarding, isLoading, user } = useAuth()
  const router   = useRouter()
  const segments = useSegments()
  const tokenRegistered = useRef(false)

  // Redirect to onboarding when needed
  useEffect(() => {
    if (isLoading) return
    const inOnboarding = segments[0] === 'onboarding'
    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding')
    }
  }, [needsOnboarding, isLoading, segments])

  // Register push token once per login
  useEffect(() => {
    if (!user || tokenRegistered.current) return
    tokenRegistered.current = true

    registerForPushNotificationsAsync().then(token => {
      if (!token) return
      // Store push token; fail silently if column doesn't exist yet
      supabase
        .from('profiles')
        .update({ push_token: token, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {})
    })
  }, [user])

  return null
}

// ── Root layout ────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  })

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.void }}>
      <SafeAreaProvider>
        <MomentumProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <NavigationGuard />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.void } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding"          options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="auth/login"         options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="auth/signup"        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="auth/callback"      options={{ animation: 'none', gestureEnabled: false }} />
              <Stack.Screen name="creator/[ticker]"   options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/[username]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="notifications"      options={{ animation: 'slide_from_right' }} />
              {/* Transparent: the Observatory keeps moving behind the cards */}
              <Stack.Screen name="discover-mode"      options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
            </Stack>
          </AuthProvider>
        </MomentumProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
