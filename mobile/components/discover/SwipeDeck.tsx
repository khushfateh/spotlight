/**
 * SwipeDeck — Discover Mode's card stack (web DiscoverStack, rebuilt for touch).
 *
 * Everything that moves runs on the UI thread. The deck position `pos` is a
 * shared value, so when a card flies out the next card is already at the top
 * pose in the same frame — React re-renders the window afterwards and nothing
 * ever jumps. Cards behind rise toward the top as you drag.
 *
 *   swipe right → Spot · swipe left → Pass · tap → profile
 */
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { View, Text, Platform } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, interpolate, Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Colors, FontFamily } from '@/lib/tokens'
import { nextTier, fmtCount, type Artist } from '@/lib/data/discover'
import ArtistImage from './ArtistImage'
import { DeltaPill } from './Cards'

export type Decision = 'spot' | 'pass'
export type DeckHandle = { swipe: (dir: 1 | -1) => void }

type Props = {
  artists: Artist[]
  width: number
  height: number
  spotted: Set<string>
  onDecision: (a: Artist, d: Decision, index: number) => void
  onOpen: (a: Artist) => void
}

const tick = () => { if (Platform.OS !== 'web') Haptics.selectionAsync() }
const thud = (dir: number) => {
  if (Platform.OS === 'web') return
  if (dir > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
}

const SwipeDeck = forwardRef<DeckHandle, Props>(function SwipeDeck({ artists, width, height, spotted, onDecision, onOpen }, ref) {
  const [index, setIndex] = useState(0)
  const pos = useSharedValue(0)
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)
  const busy = useSharedValue(0)
  const armed = useSharedValue(0)
  const count = artists.length
  const THRESH = width * 0.28

  const finish = useCallback((i: number, dir: number) => {
    setIndex(i + 1)
    const a = artists[i]
    if (a) onDecision(a, dir > 0 ? 'spot' : 'pass', i)
  }, [artists, onDecision])

  const openAt = useCallback((i: number) => {
    const a = artists[i]
    if (a) onOpen(a)
  }, [artists, onOpen])

  const flyOut = useCallback((dir: number) => {
    'worklet'
    if (busy.value || pos.value >= count) return
    busy.value = 1
    const i = pos.value
    scheduleOnRN(thud, dir)
    ty.value = withTiming(ty.value + 40, { duration: 300 })
    tx.value = withTiming(dir * width * 1.5, { duration: 300, easing: Easing.out(Easing.quad) }, (done) => {
      if (!done) return
      // Advance on the UI thread first: the next card is now the top card
      pos.value = i + 1
      tx.value = 0
      ty.value = 0
      busy.value = 0
      armed.value = 0
      scheduleOnRN(finish, i, dir)
    })
  }, [busy, pos, count, ty, tx, width, armed, finish])

  useImperativeHandle(ref, () => ({
    swipe: (dir) => { scheduleOnUI(flyOut, dir) },
  }), [flyOut])

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onChange((e) => {
      if (busy.value || pos.value >= count) return
      tx.value = e.translationX
      ty.value = e.translationY * 0.3
      const over = Math.abs(e.translationX) > THRESH ? 1 : 0
      if (over !== armed.value) { armed.value = over; scheduleOnRN(tick) }
    })
    .onEnd((e) => {
      if (busy.value || pos.value >= count) return
      if (Math.abs(tx.value) > THRESH || Math.abs(e.velocityX) > 900) {
        flyOut(Math.sign(tx.value || e.velocityX) >= 0 ? 1 : -1)
      } else {
        tx.value = withSpring(0, { damping: 15, stiffness: 170 })
        ty.value = withSpring(0, { damping: 15, stiffness: 170 })
        armed.value = 0
      }
    })
  const tap = Gesture.Tap().maxDistance(8).onEnd((_e, ok) => {
    if (ok && !busy.value && pos.value < count) scheduleOnRN(openAt, pos.value)
  })
  const gesture = Gesture.Race(pan, tap)

  // Window: the card just gone (for its last frame), the top, and two behind
  const start = Math.max(0, index - 1)
  const windowCards = artists.slice(start, index + 3).map((a, k) => ({ a, i: start + k }))

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }} collapsable={false}>
        {[...windowCards].reverse().map(({ a, i }) => (
          <Card key={a.ticker} a={a} i={i} pos={pos} tx={tx} ty={ty} width={width} height={height}
            thresh={THRESH} spotted={spotted.has(a.ticker)} />
        ))}
      </View>
    </GestureDetector>
  )
})

export default SwipeDeck

// ── One card ────────────────────────────────────────────────────────────────
function Card({ a, i, pos, tx, ty, width, height, thresh, spotted }: {
  a: Artist; i: number; pos: SharedValue<number>; tx: SharedValue<number>; ty: SharedValue<number>
  width: number; height: number; thresh: number; spotted: boolean
}) {
  const style = useAnimatedStyle(() => {
    const d = i - pos.value
    if (d < -0.5) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] }
    if (d < 0.5) {
      return {
        opacity: 1,
        transform: [
          { translateX: tx.value },
          { translateY: ty.value },
          { scale: 1 },
          { rotate: `${(tx.value / width) * 13}deg` },
        ],
      }
    }
    // Cards behind rise toward the top pose as the top card is dragged away
    const p = Math.min(1, Math.abs(tx.value) / thresh)
    const ed = d - p
    return {
      opacity: ed > 2.2 ? 0 : 1 - Math.max(0, ed - 1) * 0.6,
      transform: [{ translateX: 0 }, { translateY: ed * 16 }, { scale: 1 - ed * 0.05 }, { rotate: '0deg' }],
    }
  })
  const shade = useAnimatedStyle(() => {
    const d = i - pos.value
    const p = Math.min(1, Math.abs(tx.value) / thresh)
    return { opacity: d < 0.5 ? 0 : Math.min(0.55, (d - p) * 0.3) }
  })
  const spotStamp = useAnimatedStyle(() => {
    const top = Math.abs(i - pos.value) < 0.5
    return { opacity: top ? interpolate(tx.value, [thresh * 0.25, thresh], [0, 1], Extrapolation.CLAMP) : 0 }
  })
  const passStamp = useAnimatedStyle(() => {
    const top = Math.abs(i - pos.value) < 0.5
    return { opacity: top ? interpolate(-tx.value, [thresh * 0.25, thresh], [0, 1], Extrapolation.CLAMP) : 0 }
  })

  const nt = nextTier(a.score)

  return (
    <Animated.View style={[{
      position: 'absolute', top: 0, left: 0, width, height, borderRadius: 18, overflow: 'hidden',
      backgroundColor: '#0c0a10', borderWidth: 1, borderColor: 'rgba(201,168,76,0.28)',
    }, style]}>
      <ArtistImage uri={a.imageUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <LinearGradient
        colors={['rgba(5,5,8,0.5)', 'rgba(5,5,8,0)', 'rgba(5,5,8,0.62)', 'rgba(5,5,8,0.98)']}
        locations={[0, 0.22, 0.52, 0.9]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top row */}
      <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 8, height: 22, borderRadius: 3, justifyContent: 'center', backgroundColor: 'rgba(5,5,8,0.6)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 8, letterSpacing: 1.4, color: Colors.brassLight }}>◆ {a.tier.toUpperCase()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <DeltaPill delta={a.delta} size="md" />
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1, color: 'rgba(255,255,255,0.55)' }}>THIS WEEK</Text>
        </View>
      </View>
      {spotted && (
        <View style={{ position: 'absolute', top: 50, alignSelf: 'center', paddingHorizontal: 10, height: 20, borderRadius: 10, justifyContent: 'center', backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.5)' }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 8, letterSpacing: 1.4, color: Colors.brassLight }}>◆ ALREADY SPOTTED</Text>
        </View>
      )}

      {/* Stamps */}
      <Animated.View style={[{ position: 'absolute', top: 70, left: 22, transform: [{ rotate: '-12deg' }] }, spotStamp]}>
        <View style={{ borderWidth: 2, borderColor: Colors.brassLight, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(201,168,76,0.12)' }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 22, letterSpacing: 4, color: Colors.brassLight }}>SPOT ◆</Text>
        </View>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 70, right: 22, transform: [{ rotate: '12deg' }] }, passStamp]}>
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 22, letterSpacing: 4, color: 'rgba(255,255,255,0.85)' }}>PASS</Text>
        </View>
      </Animated.View>

      {/* Story */}
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
          {a.genre} · {a.origin}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: FontFamily.serif, fontSize: 46, lineHeight: 52, color: '#fff', marginTop: 4 }}>
          {a.name}
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: FontFamily.serifItalic, fontSize: 17, lineHeight: 22, color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
          {a.bio}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 22 }}>
          <Stat label="MOMENTUM" value={String(a.score)} />
          <Stat label="SPOTTERS" value={fmtCount(a.spotters)} />
          {nt && <Stat label={`TO ${nt.name.toUpperCase()}`} value={`${nt.pts} PTS`} accent />}
        </View>
        <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1, marginTop: 14 }}>
          <LinearGradient
            colors={['rgba(201,168,76,0.5)', Colors.brassLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 2, borderRadius: 1, width: `${Math.max(4, Math.min(100, a.score))}%` as `${number}%` }}
          />
        </View>
      </View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#050508' }, shade]} />
    </Animated.View>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View>
      <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 18, color: accent ? Colors.brassLight : '#fff', letterSpacing: -0.4 }}>{value}</Text>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, letterSpacing: 1.3, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>{label}</Text>
    </View>
  )
}
