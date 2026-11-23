import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
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
import { AuthProvider } from '@/context/AuthContext'
import { Colors } from '@/lib/tokens'

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
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.void } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth/login"  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="auth/signup" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="creator/[ticker]" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
