import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Shadow } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import GoldButton from '@/components/ui/GoldButton'
import GoldDivider from '@/components/ui/GoldDivider'
import SpottedBadge from '@/components/ui/SpottedBadge'
import ScoreBar from '@/components/ui/ScoreBar'
import MomentumBadge from '@/components/ui/MomentumBadge'
import SkeletonRow from '@/components/ui/SkeletonRow'
import { useAuth } from '@/context/AuthContext'
import { useVault, type VaultEntry } from '@/lib/hooks/useVault'
import { getCreator } from '@/lib/data/creators'

function VaultCard({ entry, index }: { entry: VaultEntry; index: number }) {
  const enterY  = useSharedValue(20)
  const enterOp = useSharedValue(0)

  useEffect(() => {
    const delay = index * 90
    enterY.value  = withDelay(delay, withTiming(0, { duration: 540, easing: Easing.out(Easing.cubic) }))
    enterOp.value = withDelay(delay, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }))
  }, [index])

  const style = useAnimatedStyle(() => ({
    opacity:   enterOp.value,
    transform: [{ translateY: enterY.value }],
  }))

  const creator = getCreator(entry.ticker)
  const scoreColor = entry.currentScore >= 90 ? Colors.brass
    : entry.currentScore >= 76 ? Colors.brassLight
    : Colors.dimWhite

  return (
    <Animated.View style={[style, { marginBottom: Spacing.md }]}>
      <GlassCard goldBorder glow>
        <View style={{ padding: Spacing.md }}>

          {/* Founding + status badges */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, flexWrap: 'wrap' }}>
            {entry.isFoundingSpot && (
              <SpottedBadge label="◈ Founding Spotter" />
            )}
            {entry.isArchived && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                paddingVertical: 3, paddingHorizontal: 7, borderRadius: 2,
              }}>
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.1, textTransform: 'uppercase' }}>
                  Archived
                </Text>
              </View>
            )}
            {!entry.isArchived && <SpottedBadge />}
          </View>

          {/* Name + score */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text style={{
                fontFamily:    FontFamily.serif,
                fontSize:      FontSize.title,
                color:         Colors.offWhite,
                letterSpacing: 0.01,
                marginBottom:  3,
              }}>
                {creator?.name ?? entry.ticker}
              </Text>
              <MonoLabel size="label" color="rgba(255,255,255,0.28)">
                {entry.ticker}
              </MonoLabel>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{
                fontFamily:    FontFamily.monoBold,
                fontSize:      36,
                color:         Colors.offWhite,
                lineHeight:    40,
                letterSpacing: -1,
              }}>
                {entry.currentScore}
              </Text>
              <MonoLabel size="label" color={Colors.brass}>Score</MonoLabel>
            </View>
          </View>

          <ScoreBar
            score={entry.currentScore}
            color={scoreColor}
            delay={index * 90 + 200}
            style={{ marginBottom: Spacing.sm }}
          />

          {/* Momentum badge + delta */}
          <View style={{ marginBottom: Spacing.sm }}>
            <MomentumBadge tier={entry.currentTier} delta={entry.currentDelta} size="sm" />
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginBottom: Spacing.sm }} />

          {/* Footer row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <MonoLabel size="label" color="rgba(255,255,255,0.22)">
                Spotted {entry.spotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </MonoLabel>
              {entry.spotterRank > 0 && (
                <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 2 }}>
                  Spotter #{entry.spotterRank.toLocaleString()}
                </MonoLabel>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <MonoLabel size="label" color="rgba(255,255,255,0.18)">
                At spot: {entry.momentumAtSpot}
              </MonoLabel>
              {entry.currentScore - entry.momentumAtSpot > 0 && (
                <MonoLabel size="label" color={Colors.success} style={{ marginTop: 2 }}>
                  +{entry.currentScore - entry.momentumAtSpot} since spot
                </MonoLabel>
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  )
}

function EmptyVault({ onDiscover }: { onDiscover: () => void }) {
  const enterOp = useSharedValue(0)
  const enterY  = useSharedValue(20)

  useEffect(() => {
    enterOp.value = withDelay(200, withTiming(1, { duration: 600 }))
    enterY.value  = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: enterOp.value, transform: [{ translateY: enterY.value }],
  }))

  return (
    <Animated.View style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }]}>
      <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 56, marginBottom: 24 }}>◇</Text>
      <Text style={{
        fontFamily:    FontFamily.serif,
        fontSize:      FontSize.title,
        color:         Colors.offWhite,
        textAlign:     'center',
        marginBottom:  12,
      }}>
        Your vault is empty
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
        Every artist you spot gets a vault card — stamped with the exact moment you called it.
      </Text>
      <GoldButton onPress={onDiscover} shimmer effect="crack">Start Discovering →</GoldButton>
    </Animated.View>
  )
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { activeEntries, archivedEntries, loading, refetch } = useVault()

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48 }}>
        <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 48, marginBottom: 20 }}>▣</Text>
        <Text style={{
          fontFamily: FontFamily.serif,
          fontSize:   FontSize.title,
          color:      Colors.offWhite,
          textAlign:  'center',
          marginBottom: 14,
        }}>
          Your vault awaits
        </Text>
        <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: Spacing.sm }}>
          ◈ Spotter Access Required
        </MonoLabel>
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      FontSize.caption,
          color:         'rgba(255,255,255,0.32)',
          textAlign:     'center',
          lineHeight:    20,
          letterSpacing: 0.04,
          marginBottom:  Spacing.xl,
        }}>
          Sign in to see the artists you've spotted{'\n'}and your founding badges.
        </Text>
        <GoldButton onPress={() => router.push('/auth/login')} shimmer effect="crack" style={{ marginBottom: 10, minWidth: 220 }}>
          Sign In
        </GoldButton>
        <GoldButton onPress={() => router.push('/auth/signup')} variant="outline" effect="crack" style={{ minWidth: 220 }}>
          Join SPOTLIGHT ◈
        </GoldButton>
      </View>
    )
  }

  const totalSpots = activeEntries.length + archivedEntries.length

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
      }}>
        <MonoLabel size="label" style={{ marginBottom: 8 }}>▣ Discovery Vault</MonoLabel>
        <Text style={{
          fontFamily:    FontFamily.serif,
          fontSize:      FontSize.heading,
          color:         Colors.offWhite,
          letterSpacing: 0.01,
        }}>
          Your Spots
        </Text>
        {!loading && (
          <MonoLabel size="label" color="rgba(255,255,255,0.28)" style={{ marginTop: 4 }}>
            {totalSpots} artist{totalSpots !== 1 ? 's' : ''} spotted
            {activeEntries.length > 0 && ` · ${activeEntries.length} active`}
          </MonoLabel>
        )}
      </View>

      {loading && totalSpots === 0 ? (
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
          <GoldDivider style={{ marginBottom: Spacing.md }} />
          {[0, 1, 2].map(i => <SkeletonRow key={i} delay={i * 80} />)}
        </View>
      ) : totalSpots === 0 ? (
        <EmptyVault onDiscover={() => router.push('/discover')} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={Colors.brass}
              colors={[Colors.brass]}
            />
          }
        >
          <GoldDivider style={{ marginBottom: Spacing.md }} />

          {/* Active spots */}
          {activeEntries.map((entry, i) => (
            <VaultCard key={entry.ticker} entry={entry} index={i} />
          ))}

          {/* Archived spots */}
          {archivedEntries.length > 0 && (
            <>
              <View style={{ marginVertical: Spacing.lg }}>
                <GoldDivider />
                <MonoLabel
                  size="label"
                  color="rgba(255,255,255,0.22)"
                  style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}
                >
                  Archived · Moved On
                </MonoLabel>
              </View>
              {archivedEntries.map((entry, i) => (
                <VaultCard key={entry.ticker} entry={entry} index={activeEntries.length + i} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}
