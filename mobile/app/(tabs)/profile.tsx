import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import GoldButton from '@/components/ui/GoldButton'
import GoldDivider from '@/components/ui/GoldDivider'
import { useAuth } from '@/context/AuthContext'
import { useVault } from '@/lib/hooks/useVault'
import { getBestSpotterRank } from '@/lib/services/profileService'

function StatCell({ label, value, delay = 0 }: { label: string; value: string | number; delay?: number }) {
  const enterOp = useSharedValue(0)
  const enterY  = useSharedValue(10)

  useEffect(() => {
    enterOp.value = withDelay(delay, withTiming(1, { duration: 500 }))
    enterY.value  = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [delay])

  const style = useAnimatedStyle(() => ({
    opacity:   enterOp.value,
    transform: [{ translateY: enterY.value }],
  }))

  return (
    <Animated.View style={[style, { flex: 1, alignItems: 'center', paddingVertical: Spacing.md }]}>
      <Text style={{
        fontFamily:    FontFamily.monoBold,
        fontSize:      28,
        color:         Colors.offWhite,
        letterSpacing: -0.5,
        lineHeight:    32,
      }}>
        {value}
      </Text>
      <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 4 }}>
        {label}
      </MonoLabel>
    </Animated.View>
  )
}

function MenuItem({
  icon, label, value, onPress, delay = 0,
}: { icon: string; label: string; value?: string; onPress: () => void; delay?: number }) {
  const scale = useSharedValue(1)
  const enterOp = useSharedValue(0)

  useEffect(() => {
    enterOp.value = withDelay(delay, withTiming(1, { duration: 400 }))
  }, [delay])

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 320 })
    })
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const style = useAnimatedStyle(() => ({
    opacity:   enterOp.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={handlePress}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm }}
      >
        <Text style={{ color: Colors.brassDim, fontSize: 14, width: 28 }}>{icon}</Text>
        <Text style={{
          flex: 1,
          fontFamily:    FontFamily.mono,
          fontSize:      FontSize.caption,
          color:         Colors.dimWhite,
          letterSpacing: 0.08,
        }}>
          {label}
        </Text>
        {value && (
          <Text style={{
            fontFamily:    FontFamily.mono,
            fontSize:      FontSize.label,
            color:         Colors.brassDim,
            marginRight:   Spacing.sm,
          }}>
            {value}
          </Text>
        )}
        <Text style={{ color: 'rgba(255,255,255,0.18)', fontSize: 14 }}>›</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, isAuthenticated, signOut, profile } = useAuth()
  const { activeEntries, archivedEntries, loading } = useVault()
  const [bestRank, setBestRank] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      getBestSpotterRank(user.id).then(r => setBestRank(r)).catch(() => {})
    }
  }, [user?.id])

  const avatarScale = useSharedValue(0.8)
  const avatarOp    = useSharedValue(0)

  useEffect(() => {
    avatarScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    avatarOp.value    = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [])

  const avatarStyle = useAnimatedStyle(() => ({
    opacity:   avatarOp.value,
    transform: [{ scale: avatarScale.value }],
  }))

  const handleSignOut = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ],
    )
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
        <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 48, marginBottom: 24 }}>◆</Text>
        <Text style={{
          fontFamily:    FontFamily.serif,
          fontSize:      FontSize.title,
          color:         Colors.offWhite,
          textAlign:     'center',
          marginBottom:  14,
          letterSpacing: 0.01,
        }}>
          Your spotter profile
        </Text>
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      FontSize.caption,
          color:         'rgba(255,255,255,0.32)',
          textAlign:     'center',
          lineHeight:    20,
          letterSpacing: 0.04,
          marginBottom:  Spacing.xl,
        }}>
          Join SPOTLIGHT to build your cultural legacy{'\n'}and track your discovery rank.
        </Text>
        <GoldButton onPress={() => router.push('/auth/signup')} shimmer style={{ marginBottom: 10, minWidth: 220 }}>
          Join SPOTLIGHT ◈
        </GoldButton>
        <GoldButton onPress={() => router.push('/auth/login')} variant="outline" style={{ minWidth: 220 }}>
          Sign In
        </GoldButton>
      </View>
    )
  }

  const username = profile?.username ?? user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Spotter'
  const avatar   = username.slice(0, 2).toUpperCase()

  const totalSpots    = activeEntries.length + archivedEntries.length
  const foundingCount = activeEntries.filter(e => e.isFoundingSpot).length
                        + archivedEntries.filter(e => e.isFoundingSpot).length
  const rankDisplay   = loading ? '—' : (bestRank ? `#${bestRank.toLocaleString()}` : '#—')

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingTop:        insets.top + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          alignItems:        'center',
          paddingBottom:     Spacing.xl,
        }}>
          <Animated.View style={[avatarStyle, {
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderWidth: 1.5, borderColor: Colors.brass,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: Spacing.md,
            shadowColor: Colors.brass,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 20,
          }]}>
            <Text style={{
              fontFamily:    FontFamily.monoBold,
              fontSize:      24,
              color:         Colors.brass,
              letterSpacing: 1,
            }}>
              {avatar}
            </Text>
          </Animated.View>

          <Text style={{
            fontFamily:    FontFamily.serif,
            fontSize:      FontSize.title,
            color:         Colors.offWhite,
            letterSpacing: 0.01,
            marginBottom:  4,
          }}>
            @{username}
          </Text>
          <MonoLabel size="label" color="rgba(255,255,255,0.25)">{user?.email}</MonoLabel>
          <View style={{
            marginTop: Spacing.sm,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
            paddingVertical: 4, paddingHorizontal: 10,
            borderRadius: Radius.sharp,
          }}>
            <Text style={{ color: Colors.brass, fontSize: 10 }}>◈</Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color: Colors.brass, letterSpacing: 0.1, textTransform: 'uppercase' }}>
              Spotter
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GlassCard goldBorder glow style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <StatCell label="Spots"    value={loading ? '—' : totalSpots}    delay={100} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatCell label="Founding" value={loading ? '—' : foundingCount}  delay={180} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatCell label="Best Rank" value={rankDisplay}                   delay={260} />
            </View>
          </GlassCard>
        </View>

        {/* Menu */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GoldDivider />
          <View style={{ marginTop: Spacing.sm }}>
            {[
              {
                icon:  '▣',
                label: 'My Vault',
                value: totalSpots > 0 ? `${totalSpots}` : undefined,
                path:  '/(tabs)/vault',
                delay: 100,
              },
              {
                icon:  '◇',
                label: 'Request an Artist',
                value: undefined,
                path:  '/(tabs)/discover',
                delay: 160,
              },
              {
                icon:  '◆',
                label: 'Notifications',
                value: undefined,
                path:  '/notifications',
                delay: 220,
              },
              {
                icon:  '◈',
                label: 'Settings',
                value: undefined,
                path:  null,
                delay: 280,
              },
            ].map(item => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                onPress={() => item.path ? router.push(item.path as any) : null}
                delay={item.delay}
              />
            ))}
          </View>
          <GoldDivider />
          <View style={{ marginTop: Spacing.xl }}>
            <GoldButton onPress={handleSignOut} variant="ghost">
              Sign out
            </GoldButton>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
