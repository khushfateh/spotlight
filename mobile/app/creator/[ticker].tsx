import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, Pressable, Platform,
  Share, Image, TextInput, KeyboardAvoidingView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, withSequence, Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily, FontSize, Spacing, Shadow, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GoldButton from '@/components/ui/GoldButton'
import GlassCard from '@/components/ui/GlassCard'
import GoldDivider from '@/components/ui/GoldDivider'
import ScoreBar from '@/components/ui/ScoreBar'
import MomentumBadge from '@/components/ui/MomentumBadge'
import SpotBottomSheet from '@/components/sheets/SpotBottomSheet'
import VaultCinematic from '@/components/experience/VaultCinematic'
import MoveOnCinematic from '@/components/experience/MoveOnCinematic'
import RediscoveryCinematic from '@/components/experience/RediscoveryCinematic'
import { useAuth } from '@/context/AuthContext'
import { useMomentum } from '@/context/MomentumContext'
import { useSpots } from '@/lib/hooks/useSpots'
import { useVault } from '@/lib/hooks/useVault'
import { getCreator } from '@/lib/data/creators'
import { logCreatorView } from '@/lib/services/signalService'
import { getPulse, castVote, VOTE_META, type VoteType, type PulseData } from '@/lib/services/pulseService'
import { getCreatorLiveData, type CreatorLiveData } from '@/lib/services/creatorService'
import { getNotes, addNote, deleteNote, type DiscoveryNote } from '@/lib/services/discoveryNotesService'

// ── Stat block ────────────────────────────────────────────────────────────────

function StatBlock({ label, value, delay = 0 }: { label: string; value: string | number; delay?: number }) {
  const enterOp = useSharedValue(0)
  const enterY  = useSharedValue(8)

  useEffect(() => {
    enterOp.value = withDelay(delay, withTiming(1, { duration: 480 }))
    enterY.value  = withDelay(delay, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }))
  }, [delay])

  const style = useAnimatedStyle(() => ({
    opacity: enterOp.value, transform: [{ translateY: enterY.value }],
  }))

  return (
    <Animated.View style={[style, { flex: 1, alignItems: 'center', paddingVertical: Spacing.md }]}>
      <Text style={{
        fontFamily:    FontFamily.monoBold,
        fontSize:      26,
        color:         Colors.offWhite,
        lineHeight:    30,
        letterSpacing: -0.5,
      }}>
        {value}
      </Text>
      <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 4 }}>{label}</MonoLabel>
    </Animated.View>
  )
}

// ── Community Pulse ───────────────────────────────────────────────────────────

function CommunityPulse({
  ticker, pulse, userId, onVote,
}: {
  ticker:  string
  pulse:   PulseData | null
  userId?: string
  onVote:  (vt: VoteType) => void
}) {
  if (!pulse) return null
  const voteTypes: VoteType[] = ['will_break_out', 'under_the_radar', 'already_peaking', 'needs_more_time']

  return (
    <View style={{ paddingVertical: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: Spacing.md }}>
        <MonoLabel size="label">◆ Community Pulse</MonoLabel>
        {pulse.total > 0 && (
          <MonoLabel size="label" color="rgba(255,255,255,0.22)">
            {pulse.total} vote{pulse.total !== 1 ? 's' : ''}
          </MonoLabel>
        )}
      </View>
      <View style={{ gap: Spacing.sm }}>
        {voteTypes.map(vt => {
          const meta     = VOTE_META[vt]
          const vote     = pulse.votes.find(v => v.type === vt)
          const isMyVote = pulse.userVoteType === vt
          const pct      = vote?.pct ?? 0
          return (
            <Pressable
              key={vt}
              onPress={() => onVote(vt)}
              style={({ pressed }) => ({
                borderRadius:    Radius.sharp,
                borderWidth:     1,
                borderColor:     isMyVote ? `${meta.color}55` : 'rgba(255,255,255,0.07)',
                backgroundColor: isMyVote ? `${meta.color}0d` : 'rgba(5,5,8,0.5)',
                overflow:        'hidden',
                opacity:         pressed ? 0.75 : 1,
              })}
            >
              {pct > 0 && (
                <View style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`, backgroundColor: `${meta.color}09`,
                }} />
              )}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.md, gap: Spacing.sm,
              }}>
                <Text style={{ color: isMyVote ? meta.color : 'rgba(255,255,255,0.3)', fontSize: 11 }}>{meta.symbol}</Text>
                <Text style={{
                  flex: 1, fontFamily: FontFamily.mono, fontSize: FontSize.caption,
                  color: isMyVote ? Colors.offWhite : Colors.dimWhite, letterSpacing: 0.04,
                }}>{meta.label}</Text>
                {pulse.total > 0 && (
                  <MonoLabel size="label" color={isMyVote ? meta.color : 'rgba(255,255,255,0.22)'}>{pct}%</MonoLabel>
                )}
                {isMyVote && (
                  <View style={{ backgroundColor: `${meta.color}22`, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color: meta.color, letterSpacing: 0.1, textTransform: 'uppercase' }}>
                      Your vote
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>
      {!userId && (
        <MonoLabel size="label" color="rgba(255,255,255,0.18)" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
          Sign in to cast your vote
        </MonoLabel>
      )}
    </View>
  )
}

// ── Discovery Notes ───────────────────────────────────────────────────────────

function DiscoveryNotesSection({
  ticker, userId, notes, loading,
  onRefresh, onDelete,
}: {
  ticker:    string
  userId?:   string
  notes:     DiscoveryNote[]
  loading:   boolean
  onRefresh: () => void
  onDelete:  (noteId: string) => void
}) {
  const [input,      setInput]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [showAll,    setShowAll]    = useState(false)

  const handleAdd = async () => {
    if (!userId || !input.trim() || submitting) return
    if (input.trim().length > 280) { setError('Max 280 characters'); return }
    setSubmitting(true)
    setError(null)
    const result = await addNote(ticker, userId, input.trim())
    setSubmitting(false)
    if (result.ok) {
      setInput('')
      onRefresh()
    } else {
      setError(result.error ?? 'Could not post note')
    }
  }

  const visibleNotes = showAll ? notes : notes.slice(0, 5)

  return (
    <View style={{ paddingVertical: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: Spacing.md }}>
        <MonoLabel size="label">◇ Discovery Notes</MonoLabel>
        {notes.length > 5 && (
          <Pressable onPress={() => setShowAll(s => !s)}>
            <MonoLabel size="label" color={Colors.brass}>{showAll ? 'Show less' : `+${notes.length - 5} more`}</MonoLabel>
          </Pressable>
        )}
      </View>

      {/* Input */}
      {userId && (
        <View style={{ marginBottom: Spacing.md }}>
          <View style={{
            flexDirection:   'row',
            alignItems:      'flex-end',
            gap:             Spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderWidth:     1,
            borderColor:     'rgba(201,168,76,0.14)',
            borderRadius:    Radius.sharp,
            padding:         Spacing.sm,
          }}>
            <TextInput
              value={input}
              onChangeText={v => { setInput(v); setError(null) }}
              placeholder="Share your take on this artist..."
              placeholderTextColor="rgba(255,255,255,0.18)"
              multiline
              maxLength={280}
              returnKeyType="send"
              onSubmitEditing={handleAdd}
              style={{
                flex:          1,
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         Colors.offWhite,
                letterSpacing: 0.03,
                lineHeight:    18,
                maxHeight:     80,
                minHeight:     36,
              }}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!input.trim() || submitting}
              style={({ pressed }) => ({
                width:           32, height: 32, borderRadius: 16,
                backgroundColor: (input.trim() && !submitting) ? Colors.brass : 'rgba(201,168,76,0.12)',
                alignItems:      'center', justifyContent: 'center',
                opacity:         pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: Colors.void, fontSize: 13, fontFamily: FontFamily.monoBold }}>↑</Text>
            </Pressable>
          </View>
          {error && (
            <Text style={{ fontFamily: FontFamily.mono, fontSize: FontSize.label, color: Colors.error, marginTop: 4, letterSpacing: 0.03 }}>
              {error}
            </Text>
          )}
        </View>
      )}

      {/* Notes list */}
      {loading && notes.length === 0 ? (
        <MonoLabel size="label" color="rgba(255,255,255,0.22)" style={{ textAlign: 'center', paddingVertical: Spacing.md }}>
          Loading notes...
        </MonoLabel>
      ) : notes.length === 0 ? (
        <View style={{
          paddingVertical:   Spacing.lg,
          alignItems:        'center',
          borderWidth:       1,
          borderColor:       'rgba(255,255,255,0.05)',
          borderRadius:      Radius.sharp,
          borderStyle:       'dashed',
        }}>
          <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 20, marginBottom: 6 }}>◇</Text>
          <MonoLabel size="label" color="rgba(255,255,255,0.18)">
            {userId ? 'Be the first to leave a note.' : 'No notes yet.'}
          </MonoLabel>
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {visibleNotes.map(note => (
            <View
              key={note.id}
              style={{
                backgroundColor: 'rgba(255,255,255,0.025)',
                borderWidth:     1,
                borderColor:     'rgba(255,255,255,0.06)',
                borderRadius:    Radius.sharp,
                padding:         Spacing.sm + 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <MonoLabel size="label" color={Colors.brass}>@{note.username ?? 'spotter'}</MonoLabel>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MonoLabel size="label" color="rgba(255,255,255,0.18)">
                    {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </MonoLabel>
                  {userId && note.userId === userId && (
                    <Pressable onPress={() => onDelete(note.id)} hitSlop={6}>
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>✕</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         'rgba(255,255,255,0.65)',
                lineHeight:    18,
                letterSpacing: 0.03,
              }}>
                {note.note}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!userId && (
        <MonoLabel size="label" color="rgba(255,255,255,0.18)" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
          Sign in to leave a discovery note
        </MonoLabel>
      )}
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ArtistProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { ticker } = useLocalSearchParams<{ ticker: string }>()
  const { isAuthenticated, user } = useAuth()
  const { getScore } = useMomentum()

  const { isSpotted, spot, moveOn } = useSpots()
  const { getByTicker }             = useVault()

  const [sheetVisible,     setSheetVisible]     = useState(false)
  const [cinematicVisible, setCinematicVisible] = useState(false)
  const [cinematicNumber,  setCinematicNumber]  = useState(0)
  const [moveOnVisible,    setMoveOnVisible]    = useState(false)
  const [moveOnDays,       setMoveOnDays]       = useState(30)
  const [rediscovVisible,  setRediscovVisible]  = useState(false)
  const [rediscovData,     setRediscovData]     = useState<{ spotterNumber: number; rediscoveryCount: number } | null>(null)
  const [pulse,            setPulse]            = useState<PulseData | null>(null)
  const [spotifyData,      setSpotifyData]      = useState<CreatorLiveData | null>(null)
  const [imageError,       setImageError]       = useState(false)
  const [notes,            setNotes]            = useState<DiscoveryNote[]>([])
  const [notesLoading,     setNotesLoading]     = useState(false)

  const heroOp    = useSharedValue(0)
  const contentOp = useSharedValue(0)
  const contentY  = useSharedValue(20)
  const shareS    = useSharedValue(1)

  useEffect(() => {
    heroOp.value    = withTiming(1, { duration: 800 })
    contentOp.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }))
    contentY.value  = withDelay(300, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
    if (ticker) logCreatorView(ticker, user?.id ?? null)
  }, [ticker])

  // Spotify / live creator data
  useEffect(() => {
    if (ticker) {
      getCreatorLiveData(ticker).then(d => setSpotifyData(d)).catch(() => {})
    }
  }, [ticker])

  // Community pulse
  const loadPulse = useCallback(async () => {
    if (!ticker) return
    const data = await getPulse(ticker, user?.id ?? null).catch(() => null)
    setPulse(data)
  }, [ticker, user?.id])

  useEffect(() => { loadPulse() }, [loadPulse])

  // Discovery notes
  const loadNotes = useCallback(async () => {
    if (!ticker) return
    setNotesLoading(true)
    const data = await getNotes(ticker, 20).catch(() => [])
    setNotes(data)
    setNotesLoading(false)
  }, [ticker])

  useEffect(() => { loadNotes() }, [loadNotes])

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return
    const ok = await deleteNote(noteId, user.id).catch(() => false)
    if (ok) loadNotes()
  }

  const handleVote = async (voteType: VoteType) => {
    if (!isAuthenticated || !user) { router.push('/auth/signup'); return }
    if (!ticker) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Optimistic update
    setPulse(prev => {
      if (!prev) return prev
      const prevType = prev.userVoteType
      const updated  = prev.votes.map(v => ({
        ...v,
        count: v.type === voteType ? v.count + 1
          : v.type === prevType    ? Math.max(0, v.count - 1)
          : v.count,
      }))
      const total = updated.reduce((s, v) => s + v.count, 0)
      return {
        votes: updated.map(v => ({ ...v, pct: total > 0 ? Math.round((v.count / total) * 100) : 0 })),
        total,
        userVoteType: voteType,
      }
    })

    await castVote(ticker, user.id, voteType).catch(() => {})
    setTimeout(() => loadPulse(), 1000)
  }

  const handleShare = async () => {
    if (!artist || !ticker) return
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    shareS.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 500 }),
      withSpring(1,   { damping: 12, stiffness: 350 }),
    )
    const { score, tier } = getScore(ticker)
    const message = vaultEntry
      ? `I spotted ${artist.name} on SPOTLIGHT — Spotter #${vaultEntry.spotterRank.toLocaleString()} · Score ${score} · ${tier} tier\n\nspotlight.fm/${artist.name.toLowerCase().replace(/\s+/g, '-')}`
      : `${artist.name} is trending on SPOTLIGHT — Score ${score} · ${tier} tier\n\nspotlight.fm/${artist.name.toLowerCase().replace(/\s+/g, '-')}`
    await Share.share({ message }).catch(() => {})
  }

  const heroStyle    = useAnimatedStyle(() => ({ opacity: heroOp.value }))
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOp.value, transform: [{ translateY: contentY.value }],
  }))
  const shareStyle = useAnimatedStyle(() => ({ transform: [{ scale: shareS.value }] }))

  const artist     = ticker ? getCreator(ticker) : null
  const { score, delta, tier, breakout, isLive } = ticker
    ? getScore(ticker)
    : { score: 50, delta: 0, tier: 'Emerging', breakout: false, isLive: false }
  const vaultEntry = ticker ? getByTicker(ticker) : undefined
  const spotted    = ticker ? isSpotted(ticker) : false

  if (!artist || !ticker) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.void, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(201,168,76,0.25)', fontSize: 40, marginBottom: Spacing.md }}>◇</Text>
        <MonoLabel>Artist not found</MonoLabel>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.lg }}>
          <MonoLabel color={Colors.brass}>← Go back</MonoLabel>
        </Pressable>
      </View>
    )
  }

  const handleSpotPress = () => {
    if (!isAuthenticated) { router.push('/auth/signup'); return }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSheetVisible(true)
  }

  const handleOpenVault = (spotterNumber: number, isRediscovery?: boolean, rediscoveryCount?: number) => {
    if (isRediscovery) {
      setRediscovData({ spotterNumber, rediscoveryCount: rediscoveryCount ?? 1 })
      setCinematicVisible(false)
      setRediscovVisible(true)
    } else {
      setCinematicNumber(spotterNumber)
      setRediscovVisible(false)
      setCinematicVisible(true)
    }
  }

  const scoreColor    = score >= 90 ? Colors.brass : score >= 76 ? Colors.brassLight : Colors.dimWhite
  const spotifyImage  = spotifyData?.spotifyImageUrl && !imageError ? spotifyData.spotifyImageUrl : null

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.void }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Back button */}
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

      {/* Share button */}
      <Animated.View style={[shareStyle, {
        position: 'absolute',
        top:   insets.top + Spacing.sm,
        right: spotted ? Spacing.lg + 90 : Spacing.lg,
        zIndex: 20,
      }]}>
        <Pressable
          onPress={handleShare}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: 'rgba(5,5,8,0.7)',
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
            alignItems: 'center', justifyContent: 'center',
          }}
          hitSlop={8}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>↑</Text>
        </Pressable>
      </Animated.View>

      {/* Spotted badge */}
      {spotted && (
        <View style={{
          position: 'absolute', top: insets.top + Spacing.sm, right: Spacing.lg, zIndex: 20,
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: 'rgba(201,168,76,0.12)',
          borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
          paddingVertical: 5, paddingHorizontal: 10, borderRadius: 2,
        }}>
          <Text style={{ color: Colors.brass, fontSize: 10 }}>◈</Text>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color: Colors.brass, letterSpacing: 0.1, textTransform: 'uppercase' }}>
            Spotted
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={[heroStyle, { height: 320, backgroundColor: Colors.surface1 }]}>
          {/* Ambient glow */}
          <View style={{
            position: 'absolute', top: 20, left: '50%',
            width: 240, height: 240, marginLeft: -120, borderRadius: 120,
            backgroundColor: 'rgba(201,168,76,0.04)',
            shadowColor: Colors.brass,
            shadowOpacity: spotted ? 0.35 : breakout ? 0.28 : 0.18,
            shadowRadius: spotted ? 80 : 60,
            shadowOffset: { width: 0, height: 0 },
          }} />

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Spacing.xl }}>
            {/* Artist image — Spotify photo or fallback ◈ */}
            {spotifyImage ? (
              <Image
                source={{ uri: spotifyImage }}
                style={{
                  width: 96, height: 96, borderRadius: 48,
                  borderWidth: 1.5,
                  borderColor: spotted ? Colors.brass : breakout ? Colors.brassLight : 'rgba(201,168,76,0.4)',
                  marginBottom: Spacing.lg,
                  ...Shadow.goldStrong,
                }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={{
                width: 96, height: 96, borderRadius: 48,
                backgroundColor: 'rgba(201,168,76,0.07)',
                borderWidth: 1.5,
                borderColor: spotted ? Colors.brass : breakout ? Colors.brassLight : 'rgba(201,168,76,0.4)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: Spacing.lg,
                ...Shadow.goldStrong,
              }}>
                <Text style={{ color: Colors.brass, fontSize: 36 }}>◈</Text>
              </View>
            )}

            <MonoLabel size="label" color={Colors.brassDim} style={{ marginBottom: 6 }}>{ticker}</MonoLabel>
            <Text style={{
              fontFamily: FontFamily.serif, fontSize: FontSize.heading,
              color: Colors.offWhite, letterSpacing: 0.01, textAlign: 'center',
            }}>
              {artist.name}
            </Text>
            <Text style={{
              fontFamily: FontFamily.mono, fontSize: FontSize.caption,
              color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: 0.08,
            }}>
              {artist.genre} · {artist.origin}
            </Text>

            {/* Spotify followers pill */}
            {spotifyData?.spotifyFollowers != null && (
              <View style={{
                marginTop: 8,
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: 'rgba(30,215,96,0.08)',
                borderWidth: 1, borderColor: 'rgba(30,215,96,0.15)',
                paddingVertical: 3, paddingHorizontal: 8, borderRadius: Radius.pill,
              }}>
                <Text style={{ color: 'rgba(30,215,96,0.7)', fontSize: 8 }}>♪</Text>
                <Text style={{
                  fontFamily: FontFamily.mono, fontSize: 7,
                  color: 'rgba(30,215,96,0.6)', letterSpacing: 0.05,
                }}>
                  {formatFollowers(spotifyData.spotifyFollowers)} on Spotify
                </Text>
              </View>
            )}
          </View>

          <LinearGradient
            colors={['transparent', Colors.void]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
            pointerEvents="none"
          />
        </Animated.View>

        {/* Content */}
        <Animated.View style={[contentStyle, { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm }]}>

          {/* Momentum badge + live indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
            <MomentumBadge tier={tier} delta={delta} />
            {isLive && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: 'rgba(82,215,138,0.08)',
                borderWidth: 1, borderColor: 'rgba(82,215,138,0.2)',
                paddingVertical: 3, paddingHorizontal: 8, borderRadius: Radius.pill,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.success }} />
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color: Colors.success, letterSpacing: 0.1, textTransform: 'uppercase' }}>
                  Live
                </Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <GlassCard goldBorder glow style={{ marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row' }}>
              <StatBlock label="Score"    value={score}                            delay={300} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatBlock label="Spotters" value={artist.spotters.toLocaleString()} delay={380} />
              <View style={{ width: 1, backgroundColor: 'rgba(201,168,76,0.08)', marginVertical: Spacing.md }} />
              <StatBlock label="Rank"     value={breakout ? '◆' : '#—'}           delay={460} />
            </View>
            <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
              <ScoreBar score={score} color={scoreColor} delay={500} />
            </View>
          </GlassCard>

          <GoldDivider />

          {/* Vault entry (if spotted) */}
          {vaultEntry && (
            <>
              <View style={{ paddingVertical: Spacing.md }}>
                <MonoLabel size="label" style={{ marginBottom: Spacing.sm }}>◈ Your Discovery</MonoLabel>
                <Pressable onPress={() => handleOpenVault(vaultEntry.spotterRank)} style={{ marginTop: 4 }}>
                  <GlassCard goldBorder glow>
                    <View style={{ padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        {vaultEntry.isFoundingSpot && (
                          <MonoLabel size="label" color={Colors.brass} style={{ marginBottom: 4 }}>◈ Founding Spotter</MonoLabel>
                        )}
                        <MonoLabel size="label" color={Colors.dimWhite}>
                          Spotter #{vaultEntry.spotterRank.toLocaleString()}
                        </MonoLabel>
                        <MonoLabel size="label" color="rgba(255,255,255,0.22)" style={{ marginTop: 3 }}>
                          {vaultEntry.spotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </MonoLabel>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 20, color: Colors.offWhite, letterSpacing: -0.4 }}>
                          {vaultEntry.momentumAtSpot}
                        </Text>
                        <MonoLabel size="label" color={Colors.brassDim}>at spot</MonoLabel>
                        {score - vaultEntry.momentumAtSpot > 0 && (
                          <MonoLabel size="label" color={Colors.success} style={{ marginTop: 2 }}>
                            +{score - vaultEntry.momentumAtSpot}
                          </MonoLabel>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
                <MonoLabel size="label" color="rgba(255,255,255,0.14)" style={{ textAlign: 'center', marginTop: 6 }}>
                  Tap to open vault cinematic
                </MonoLabel>
              </View>
              <GoldDivider />
            </>
          )}

          {/* Bio */}
          <View style={{ paddingVertical: Spacing.lg }}>
            <MonoLabel size="label" style={{ marginBottom: Spacing.sm }}>About</MonoLabel>
            <Text style={{
              fontFamily: FontFamily.serif, fontSize: FontSize.bodyLg + 2,
              color: 'rgba(255,255,255,0.72)', lineHeight: 30, letterSpacing: 0.01,
            }}>
              {artist.bio}
            </Text>
          </View>

          <GoldDivider />

          {/* Community Pulse */}
          <CommunityPulse ticker={ticker} pulse={pulse} userId={user?.id} onVote={handleVote} />

          <GoldDivider />

          {/* Discovery Notes */}
          <DiscoveryNotesSection
            ticker={ticker}
            userId={user?.id}
            notes={notes}
            loading={notesLoading}
            onRefresh={loadNotes}
            onDelete={handleDeleteNote}
          />

          <GoldDivider />

          {/* Details */}
          <View style={{ paddingVertical: Spacing.lg, gap: Spacing.sm }}>
            <MonoLabel size="label" style={{ marginBottom: 4 }}>Details</MonoLabel>
            {[
              { label: 'Genre',    value: artist.genre },
              { label: 'Origin',   value: artist.origin },
              { label: 'Ticker',   value: ticker ?? '' },
              { label: 'Tier',     value: tier },
              ...(spotifyData?.spotifyPopularity != null
                ? [{ label: 'Spotify Pop.', value: `${spotifyData.spotifyPopularity}/100` }]
                : []),
            ].map(item => (
              <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <MonoLabel size="caption" color="rgba(255,255,255,0.28)">{item.label}</MonoLabel>
                <Text style={{
                  fontFamily: FontFamily.mono, fontSize: FontSize.caption,
                  color: Colors.offWhite, letterSpacing: 0.03,
                }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md, paddingHorizontal: Spacing.lg,
        backgroundColor: 'rgba(5,5,8,0.95)',
        borderTopWidth: 1, borderTopColor: 'rgba(201,168,76,0.08)',
      }}>
        {spotted ? (
          <GoldButton onPress={handleSpotPress} fullWidth variant="outline">
            ◈ Spotted  ·  Manage →
          </GoldButton>
        ) : (
          <GoldButton onPress={handleSpotPress} fullWidth shimmer>
            Spot {artist.name} ◈
          </GoldButton>
        )}
      </View>

      {/* SpotBottomSheet */}
      <SpotBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        ticker={ticker ?? ''}
        isSpotted={spotted}
        vaultEntry={vaultEntry}
        onSpot={() => spot(ticker ?? '')}
        onMoveOn={(days) => moveOn(ticker ?? '', days)}
        onOpenVault={handleOpenVault}
        onMoveOnComplete={(days) => {
          setMoveOnDays(days)
          setTimeout(() => setMoveOnVisible(true), 100)
        }}
      />

      {/* VaultCinematic */}
      <VaultCinematic
        visible={cinematicVisible}
        onDismiss={() => setCinematicVisible(false)}
        artistName={artist.name}
        ticker={ticker ?? ''}
        spotterNumber={cinematicNumber || vaultEntry?.spotterRank || 1}
        score={score}
        tier={tier}
        isFoundingSpot={vaultEntry?.isFoundingSpot ?? false}
      />

      {/* MoveOnCinematic */}
      <MoveOnCinematic
        visible={moveOnVisible}
        onDismiss={() => setMoveOnVisible(false)}
        artistName={artist.name}
        ticker={ticker ?? ''}
        durationDays={moveOnDays}
        spotterRank={vaultEntry?.spotterRank ?? 0}
      />

      {/* RediscoveryCinematic */}
      <RediscoveryCinematic
        visible={rediscovVisible}
        onDismiss={() => setRediscovVisible(false)}
        artistName={artist.name}
        ticker={ticker ?? ''}
        spotterNumber={rediscovData?.spotterNumber ?? 0}
        score={score}
        tier={tier}
        rediscoveryCount={rediscovData?.rediscoveryCount ?? 1}
      />
    </KeyboardAvoidingView>
  )
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
