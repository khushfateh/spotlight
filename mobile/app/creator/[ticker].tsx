// Artist Profile — full-bleed. Phase 1 adds artist photo + momentum chart.

import { View, Text, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GoldButton from '@/components/ui/GoldButton'
import GlassCard from '@/components/ui/GlassCard'
import GoldDivider from '@/components/ui/GoldDivider'
import SpottedBadge from '@/components/ui/SpottedBadge'
import { useAuth } from '@/context/AuthContext'

// Mock — Phase 2 replaces with real DB lookup
const MOCK: Record<string, { name: string; genre: string; score: number; spotters: number; bio: string }> = {
  APDHILLON:   { name: 'AP Dhillon',        genre: 'Punjabi Pop',  score: 94, spotters: 2841, bio: 'The defining voice of the Punjabi diaspora.' },
  KARANAUJLA:  { name: 'Karan Aujla',       genre: 'Punjabi Hip-Hop', score: 91, spotters: 1920, bio: 'From underground bars to global stages.' },
  HANUMANKIND: { name: 'Hanumankind',       genre: 'Hip-Hop',      score: 88, spotters: 1540, bio: 'Chennai-bred. Globally heard.' },
  SABRINAC:    { name: 'Sabrina Carpenter', genre: 'Pop',          score: 87, spotters: 3210, bio: 'Short n\' Sweet.' },
  DOJACAT:     { name: 'Doja Cat',          genre: 'Pop / R&B',    score: 85, spotters: 4100, bio: 'Iconic. Undeniable.' },
  TYLERTC:     { name: 'Tyler the Creator', genre: 'Hip-Hop',      score: 83, spotters: 3800, bio: 'Golf. Igor. Chromatica. Next.' },
}

export default function ArtistProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { ticker } = useLocalSearchParams<{ ticker: string }>()
  const { isAuthenticated } = useAuth()

  const artist = ticker ? MOCK[ticker] : null

  if (!artist) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center' }}>
        <MonoLabel>Artist not found</MonoLabel>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <MonoLabel color={Colors.brass}>← Go back</MonoLabel>
        </Pressable>
      </View>
    )
  }

  const handleSpot = () => {
    if (!isAuthenticated) { router.push('/auth/signup'); return }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    // Phase 2: open SpotBottomSheet
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      {/* Back */}
      <Pressable
        onPress={() => router.back()}
        style={{ position: 'absolute', top: insets.top + Spacing.sm, left: Spacing.lg, zIndex: 10 }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 24 }}>‹</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero area — Phase 1: artist photo + parallax here */}
        <View style={{
          height: 320, backgroundColor: Colors.surface1,
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: Spacing.xl,
        }}>
          {/* Avatar placeholder */}
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderWidth: 1.5, borderColor: Colors.brass,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: Spacing.lg,
            shadowColor: Colors.brass, shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 0 }, shadowRadius: 30,
          }}>
            <Text style={{ color: Colors.brass, fontSize: 36 }}>◈</Text>
          </View>
          <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 6 }}>
            {ticker}
          </MonoLabel>
          <SerifHeading size="title">{artist.name}</SerifHeading>
          <MonoLabel size="caption" color="rgba(255,255,255,0.40)" style={{ marginTop: 4 }}>
            {artist.genre}
          </MonoLabel>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
          <GlassCard goldBorder style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: 'Score',    value: artist.score },
                { label: 'Spotters', value: artist.spotters.toLocaleString() },
                { label: 'Rank',     value: '#12' },
              ].map((stat, i, arr) => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
                  borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: Colors.glassBorder }}>
                  <Text style={{ fontFamily: FontFamily.mono, fontSize: 24, color: Colors.offWhite, fontWeight: '700' }}>
                    {stat.value}
                  </Text>
                  <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 4 }}>{stat.label}</MonoLabel>
                </View>
              ))}
            </View>
          </GlassCard>

          <GoldDivider />

          {/* Bio */}
          <View style={{ paddingVertical: Spacing.lg }}>
            <MonoLabel size="label" style={{ marginBottom: Spacing.sm }}>About</MonoLabel>
            <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.title, color: 'rgba(255,255,255,0.75)', lineHeight: 30, letterSpacing: 0.01 }}>
              {artist.bio}
            </Text>
          </View>

          <GoldDivider />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: 'rgba(5,5,8,0.95)',
        borderTopWidth: 1, borderTopColor: Colors.glassBorder,
      }}>
        <GoldButton onPress={handleSpot} fullWidth>
          Spot {artist.name} ◈
        </GoldButton>
      </View>
    </View>
  )
}
