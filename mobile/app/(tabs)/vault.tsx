// Vault — user's spotted artists. Auth-gated.

import { View, Text, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import SerifHeading from '@/components/ui/SerifHeading'
import GlassCard from '@/components/ui/GlassCard'
import GoldButton from '@/components/ui/GoldButton'
import GoldDivider from '@/components/ui/GoldDivider'
import SpottedBadge from '@/components/ui/SpottedBadge'
import { useAuth } from '@/context/AuthContext'

// Mock vault — Phase 2 pulls from useVault hook
const MOCK_VAULT = [
  { name: 'AP Dhillon',   ticker: 'APDHILLON',   spotDate: 'Nov 12, 2026', score: 94, isFounding: true  },
  { name: 'Karan Aujla',  ticker: 'KARANAUJLA',  spotDate: 'Nov 8, 2026',  score: 91, isFounding: false },
  { name: 'Hanumankind',  ticker: 'HANUMANKIND', spotDate: 'Oct 30, 2026', score: 88, isFounding: true  },
]

function EmptyVault({ onDiscover }: { onDiscover: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
      <Text style={{ color: 'rgba(201,168,76,0.25)', fontSize: 48, marginBottom: 24 }}>◇</Text>
      <SerifHeading size="title" style={{ textAlign: 'center', marginBottom: 12 }}>
        Your vault is empty
      </SerifHeading>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20, letterSpacing: 0.04, marginBottom: 32 }}>
        Every artist you spot gets a vault card — stamped with the exact moment you called it.
      </Text>
      <GoldButton onPress={onDiscover}>Start Discovering →</GoldButton>
    </View>
  )
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
        <MonoLabel size="label" style={{ marginBottom: 24 }}>◈ Spotter Access Required</MonoLabel>
        <SerifHeading size="title" style={{ textAlign: 'center', marginBottom: 16 }}>
          Your vault awaits
        </SerifHeading>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20, letterSpacing: 0.04, marginBottom: 32 }}>
          Sign in to see the artists you've spotted and your founding badges.
        </Text>
        <GoldButton onPress={() => router.push('/auth/login')} style={{ marginBottom: 12 }}>Sign In</GoldButton>
        <GoldButton onPress={() => router.push('/auth/signup')} variant="outline">Join SPOTLIGHT ◈</GoldButton>
      </View>
    )
  }

  if (MOCK_VAULT.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void }}>
        <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
          <MonoLabel size="label" style={{ marginBottom: 8 }}>▣ Discovery Vault</MonoLabel>
          <SerifHeading size="heading">Your Spots</SerifHeading>
        </View>
        <EmptyVault onDiscover={() => router.push('/discover')} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
        <MonoLabel size="label" style={{ marginBottom: 8 }}>▣ Discovery Vault</MonoLabel>
        <SerifHeading size="heading">Your Spots</SerifHeading>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.04, marginTop: 4 }}>
          {MOCK_VAULT.length} artist{MOCK_VAULT.length !== 1 ? 's' : ''} spotted
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <GoldDivider />
        <View style={{ height: Spacing.md }} />

        {MOCK_VAULT.map(card => (
          <GlassCard
            key={card.ticker}
            goldBorder
            style={{ marginBottom: Spacing.md, padding: Spacing.md }}
          >
            {/* Founding badge */}
            {card.isFounding && (
              <View style={{ marginBottom: Spacing.sm }}>
                <SpottedBadge label="◈ Founding Requester" />
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.title, color: Colors.offWhite, letterSpacing: 0.01 }}>
                  {card.name}
                </Text>
                <MonoLabel size="label" color="rgba(255,255,255,0.28)" style={{ marginTop: 2 }}>
                  {card.ticker}
                </MonoLabel>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.heading, color: Colors.offWhite, fontWeight: '700', lineHeight: 36 }}>
                  {card.score}
                </Text>
                <MonoLabel size="label" color={Colors.brass}>Score</MonoLabel>
              </View>
            </View>

            <GoldDivider />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
              <MonoLabel size="label" color="rgba(255,255,255,0.22)">
                Spotted {card.spotDate}
              </MonoLabel>
              <SpottedBadge />
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  )
}
