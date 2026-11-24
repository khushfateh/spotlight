import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing,
} from 'react-native-reanimated'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import GoldDivider from '@/components/ui/GoldDivider'
import SkeletonRow from '@/components/ui/SkeletonRow'
import { getProfileByUsername, type Profile } from '@/lib/services/profileService'
import { getUserVaultCards, type VaultCard } from '@/lib/services/vaultService'
import { getCreator } from '@/lib/data/creators'
import { useMomentum } from '@/context/MomentumContext'

type LoadState = 'loading' | 'found' | 'not_found'

function StatBadge({ label, value, delay = 0 }: { label: string; value: string | number; delay?: number }) {
  const op = useSharedValue(0)
  const y  = useSharedValue(8)
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 480 }))
    y.value  = withDelay(delay, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }))
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: y.value }] }))
  return (
    <Animated.View style={[style, { flex: 1, alignItems: 'center', paddingVertical: Spacing.md }]}>
      <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 24, color: Colors.offWhite, letterSpacing: -0.5, lineHeight: 28 }}>
        {value}
      </Text>
      <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 4 }}>{label}</MonoLabel>
    </Animated.View>
  )
}

function ArtistSpotRow({ card, index }: { card: VaultCard; index: number }) {
  const router   = useRouter()
  const { getScore } = useMomentum()
  const enterOp  = useSharedValue(0)
  const enterY   = useSharedValue(12)

  useEffect(() => {
    enterOp.value = withDelay(index * 60, withTiming(1, { duration: 400 }))
    enterY.value  = withDelay(index * 60, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }))
  }, [])

  const rowStyle = useAnimatedStyle(() => ({ opacity: enterOp.value, transform: [{ translateY: enterY.value }] }))
  const creator  = getCreator(card.ticker)
  const { score } = getScore(card.ticker)

  return (
    <Animated.View style={rowStyle}>
      <Pressable onPress={() => router.push(`/creator/${card.ticker}`)}>
        <GlassCard style={{ marginBottom: 0 }}>
          <View style={{ padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.bodyLg, color: Colors.offWhite, letterSpacing: 0.01 }}>
                {creator?.name ?? card.ticker}
              </Text>
              <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 2 }}>
                Spotter #{card.spotterRank}
              </MonoLabel>
            </View>
            <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 20, color: Colors.offWhite, letterSpacing: -0.4 }}>
              {score}
            </Text>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  )
}

export default function PublicProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { username } = useLocalSearchParams<{ username: string }>()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [cards,     setCards]     = useState<VaultCard[]>([])

  const headerOp = useSharedValue(0)
  const headerY  = useSharedValue(16)

  useEffect(() => {
    if (!username) { setLoadState('not_found'); return }
    const slug = (username as string).replace(/^@/, '').toLowerCase()

    getProfileByUsername(slug).then(async p => {
      if (!p) { setLoadState('not_found'); return }
      setProfile(p)
      const vaultCards = await getUserVaultCards(p.id).catch(() => [])
      setCards(vaultCards.filter(c => c.spotStatus !== 'archived').slice(0, 12))
      setLoadState('found')
      headerOp.value = withTiming(1, { duration: 600 })
      headerY.value  = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    })
  }, [username])

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value, transform: [{ translateY: headerY.value }],
  }))

  if (loadState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void }}>
        <Pressable
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + Spacing.sm, left: Spacing.lg, zIndex: 20 }}
          hitSlop={8}
        >
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>‹</Text>
        </Pressable>
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: insets.top + 60 }}>
          {[0, 1, 2].map(i => <SkeletonRow key={i} delay={i * 80} />)}
        </View>
      </View>
    )
  }

  if (loadState === 'not_found' || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 40, marginBottom: Spacing.md }}>◇</Text>
        <Text style={{ fontFamily: FontFamily.serif, fontSize: FontSize.title, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Profile not found
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.lg }}>
          <MonoLabel color={Colors.brass}>← Go back</MonoLabel>
        </Pressable>
      </View>
    )
  }

  const displayName  = profile.display_name ?? profile.username ?? 'Spotter'
  const avatarLetters = displayName.slice(0, 2).toUpperCase()
  const memberSince  = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute', top: insets.top + Spacing.sm, left: Spacing.lg, zIndex: 20,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'rgba(5,5,8,0.7)',
          borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}
        hitSlop={8}
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, lineHeight: 24 }}>‹</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[headerStyle, {
          paddingTop: insets.top + Spacing.xl + 20,
          paddingHorizontal: Spacing.lg,
          alignItems: 'center',
          paddingBottom: Spacing.xl,
        }]}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderWidth: 1.5, borderColor: Colors.brass,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: Spacing.md,
            ...Shadow.goldStrong,
          }}>
            <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 24, color: Colors.brass, letterSpacing: 1 }}>
              {avatarLetters}
            </Text>
          </View>

          <Text style={{
            fontFamily: FontFamily.serif, fontSize: FontSize.title,
            color: Colors.offWhite, letterSpacing: 0.01, marginBottom: 4,
          }}>
            @{profile.username ?? displayName}
          </Text>

          <MonoLabel size="label" color="rgba(255,255,255,0.22)">Member since {memberSince}</MonoLabel>

          {profile.discovery_rank && (
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
                {profile.discovery_rank}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GlassCard goldBorder glow style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <StatBadge label="Spots"  value={profile.creators_spotted ?? cards.length} delay={100} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatBadge label="Score"  value={profile.discovery_score ?? 0}             delay={180} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatBadge label="Rank"   value={profile.discovery_rank ?? 'Spotter'}      delay={260} />
            </View>
          </GlassCard>
        </View>

        {/* Spotted artists */}
        {cards.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <GoldDivider style={{ marginBottom: Spacing.md }} />
            <MonoLabel size="label" style={{ marginBottom: Spacing.md }}>◈ Spotted Artists</MonoLabel>
            <View style={{ gap: Spacing.sm }}>
              {cards.map((card, i) => (
                <ArtistSpotRow key={card.ticker} card={card} index={i} />
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  )
}
