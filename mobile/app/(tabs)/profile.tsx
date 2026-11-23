// Profile — user stats and settings.

import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GlassCard from '@/components/ui/GlassCard'
import GoldButton from '@/components/ui/GoldButton'
import GoldDivider from '@/components/ui/GoldDivider'
import { useAuth } from '@/context/AuthContext'

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.md }}>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 28, color: Colors.offWhite, fontWeight: '700' }}>
        {value}
      </Text>
      <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 4 }}>{label}</MonoLabel>
    </View>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, isAuthenticated, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
        <Text style={{ color: 'rgba(201,168,76,0.25)', fontSize: 48, marginBottom: 24 }}>◆</Text>
        <SerifHeading size="title" style={{ textAlign: 'center', marginBottom: 16 }}>
          Your spotter profile
        </SerifHeading>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20, letterSpacing: 0.04, marginBottom: 32 }}>
          Join SPOTLIGHT to build your cultural legacy and track your discovery rank.
        </Text>
        <GoldButton onPress={() => router.push('/auth/signup')} style={{ marginBottom: 12 }}>
          Join SPOTLIGHT ◈
        </GoldButton>
        <GoldButton onPress={() => router.push('/auth/login')} variant="outline">
          Sign In
        </GoldButton>
      </View>
    )
  }

  const username = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Spotter'
  const avatar   = username.slice(0, 2).toUpperCase()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + Spacing.lg, paddingHorizontal: Spacing.lg, alignItems: 'center', paddingBottom: Spacing.xl }}>
          {/* Avatar */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: 'rgba(201,168,76,0.10)',
            borderWidth: 1.5, borderColor: Colors.brass,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: Spacing.md,
            shadowColor: Colors.brass, shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 0 }, shadowRadius: 20,
          }}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 22, fontWeight: '700', color: Colors.brass }}>
              {avatar}
            </Text>
          </View>
          <SerifHeading size="title" style={{ marginBottom: 4 }}>@{username}</SerifHeading>
          <MonoLabel size="label" color="rgba(255,255,255,0.28)">{user?.email}</MonoLabel>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GlassCard goldBorder style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <StatPill label="Spots"    value={3} />
              <View style={{ width: 1, backgroundColor: Colors.glassBorder, marginVertical: Spacing.md }} />
              <StatPill label="Founding" value={2} />
              <View style={{ width: 1, backgroundColor: Colors.glassBorder, marginVertical: Spacing.md }} />
              <StatPill label="Rank"     value="#—" />
            </View>
          </GlassCard>
        </View>

        {/* Menu */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GoldDivider />
          <View style={{ marginTop: Spacing.md, gap: 2 }}>
            {[
              { label: 'My Vault',          icon: '▣', path: '/vault' },
              { label: 'Request an Artist', icon: '◈', path: '/discover' },
              { label: 'Notifications',     icon: '◇', path: null },
              { label: 'Settings',          icon: '◆', path: null },
            ].map(item => (
              <Pressable
                key={item.label}
                onPress={() => item.path ? router.push(item.path as any) : null}
                style={({ pressed }) => ({
                  flexDirection:   'row',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  paddingVertical:  Spacing.md,
                  paddingHorizontal: Spacing.sm,
                  borderRadius:    Radius.sharp,
                  backgroundColor: pressed ? 'rgba(201,168,76,0.05)' : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Text style={{ color: Colors.brassDim, fontSize: 14 }}>{item.icon}</Text>
                  <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: Colors.dimWhite, letterSpacing: 0.08 }}>
                    {item.label}
                  </Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.20)', fontSize: 12 }}>›</Text>
              </Pressable>
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
