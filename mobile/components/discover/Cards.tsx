/**
 * Discover cards — every surface that shows an artist on the Observatory page.
 *   MoverCard      Rising Fast (top section): a compact "top mover" ticker card
 *   EditorialCard  portrait card for the editorial rails
 *   FeatureCard    the Editor's Pick hero
 *   RankRow        the ranked All Creators / results list
 */
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily } from '@/lib/tokens'
import { nextTier, fmtCount, type Artist } from '@/lib/data/discover'
import ArtistImage from './ArtistImage'
import PressScale from './PressScale'

const GREEN = '#52d78a'
const RED = '#e05555'

export function DeltaPill({ delta, size = 'sm' }: { delta: number; size?: 'sm' | 'md' }) {
  const up = delta >= 0
  const c = up ? GREEN : RED
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: size === 'md' ? 8 : 6, height: size === 'md' ? 22 : 18, borderRadius: 4,
      backgroundColor: up ? 'rgba(82,215,138,0.13)' : 'rgba(224,85,85,0.13)',
    }}>
      <Text style={{ color: c, fontSize: size === 'md' ? 8 : 7 }}>{up ? '▲' : '▼'}</Text>
      <Text style={{ fontFamily: FontFamily.monoBold, fontSize: size === 'md' ? 11 : 10, color: c, letterSpacing: -0.2 }}>
        {Math.abs(delta)}
      </Text>
    </View>
  )
}

/** Thin brass momentum meter with a tick at the next tier */
function MomentumMeter({ score, width }: { score: number; width?: number }) {
  const nt = nextTier(score)
  return (
    <View style={{ height: 2, width: width ?? '100%', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 1 }}>
      <LinearGradient
        colors={['rgba(201,168,76,0.5)', Colors.brassLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ height: 2, width: `${Math.max(4, Math.min(100, score))}%` as `${number}%`, borderRadius: 1 }}
      />
      {nt && (
        <View style={{ position: 'absolute', left: `${score + nt.pts}%` as `${number}%`, top: -2, width: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      )}
    </View>
  )
}

// ── Rising Fast ─────────────────────────────────────────────────────────────
export const MOVER_W = 148
export function MoverCard({ a, onPress }: { a: Artist; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} accessibilityLabel={`${a.name}, momentum ${a.score}, up ${a.delta}`}>
      <View style={{
        width: MOVER_W, padding: 12, borderRadius: 6, gap: 9,
        backgroundColor: 'rgba(10,8,16,0.74)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.14)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ArtistImage uri={a.imageUrl} style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' }} />
          <DeltaPill delta={a.delta} />
        </View>
        <View>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: FontFamily.serifMedium, fontSize: 16, color: Colors.offWhite }}>{a.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
            <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 22, color: '#fff', letterSpacing: -0.6 }}>{a.score}</Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1, color: Colors.brass, textTransform: 'uppercase' }}>{a.tier}</Text>
          </View>
        </View>
        <MomentumMeter score={a.score} />
      </View>
    </PressScale>
  )
}

// ── Editorial rail card ─────────────────────────────────────────────────────
export const EDITORIAL_W = 138
export type Accent = { color: string; badge: string }

export function EditorialCard({ a, accent, showNextTier, onPress }: { a: Artist; accent: Accent; showNextTier?: boolean; onPress: () => void }) {
  const nt = showNextTier ? nextTier(a.score) : null
  return (
    <PressScale onPress={onPress} accessibilityLabel={`${a.name}, ${a.tier}`}>
      <View style={{ width: EDITORIAL_W, height: 206, borderRadius: 6, overflow: 'hidden', backgroundColor: '#0c0a10' }}>
        <ArtistImage uri={a.imageUrl} align="top" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient
          colors={['rgba(5,5,8,0)', 'rgba(5,5,8,0.25)', 'rgba(5,5,8,0.96)']}
          locations={[0, 0.42, 0.92]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 6, borderWidth: 1, borderColor: `${accent.color}33` }} />
        <View style={{
          position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, height: 17, justifyContent: 'center', borderRadius: 2,
          backgroundColor: 'rgba(5,5,8,0.62)', borderWidth: 1, borderColor: `${accent.color}55`,
        }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 7, letterSpacing: 1, color: accent.color }}>{accent.badge}</Text>
        </View>
        <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, gap: 4 }}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ fontFamily: FontFamily.serifMedium, fontSize: 17, color: '#fff' }}>{a.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 15, color: '#fff' }}>{a.score}</Text>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, letterSpacing: 0.9, color: Colors.brass, textTransform: 'uppercase' }}>{a.tier}</Text>
            </View>
            <DeltaPill delta={a.delta} />
          </View>
          {nt && (
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 0.8, color: accent.color, marginTop: 1 }}>
              {nt.pts} {nt.pts === 1 ? 'PT' : 'PTS'} TO {nt.name.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
    </PressScale>
  )
}

// ── Editor's Pick hero ──────────────────────────────────────────────────────
export function FeatureCard({ a, note, width, onPress }: { a: Artist; note: string; width: number; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} depth={0.98} accessibilityLabel={`Editor's pick: ${a.name}`}>
      <View style={{ width, height: Math.round(width * 0.78), borderRadius: 8, overflow: 'hidden', backgroundColor: '#0c0a10' }}>
        <ArtistImage uri={a.imageUrl} align="top" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient
          colors={['rgba(5,5,8,0.35)', 'rgba(5,5,8,0)', 'rgba(5,5,8,0.55)', 'rgba(5,5,8,0.97)']}
          locations={[0, 0.25, 0.55, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(167,139,250,0.28)' }} />
        <View style={{ position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#a78bfa', fontSize: 10 }}>★</Text>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 8, letterSpacing: 1.6, color: '#c4b5fd' }}>EDITOR'S PICK</Text>
        </View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
          <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>
            {a.genre} · {a.origin}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: FontFamily.serif, fontSize: 36, lineHeight: 40, color: '#fff' }}>{a.name}</Text>
          <Text style={{ fontFamily: FontFamily.serifItalic, fontSize: 16, lineHeight: 21, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>
            “{note}”
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 18, color: '#fff' }}>{a.score}</Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1, color: Colors.brass, textTransform: 'uppercase' }}>{a.tier}</Text>
            <DeltaPill delta={a.delta} size="md" />
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.2, color: Colors.brassLight }}>VIEW ↗</Text>
          </View>
        </View>
      </View>
    </PressScale>
  )
}

// ── Ranked row ──────────────────────────────────────────────────────────────
export function RankRow({ a, rank, onPress }: { a: Artist; rank: number; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} depth={0.98} accessibilityLabel={`${rank}. ${a.name}, momentum ${a.score}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.07)' }}>
        <Text style={{ width: 26, fontFamily: FontFamily.mono, fontSize: 10, color: rank <= 3 ? Colors.brass : 'rgba(255,255,255,0.22)' }}>
          {String(rank).padStart(2, '0')}
        </Text>
        <ArtistImage uri={a.imageUrl} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: rank <= 3 ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.18)' }} />
        <View style={{ flex: 1, marginLeft: 12, gap: 3 }}>
          <Text numberOfLines={1} style={{ fontFamily: FontFamily.serifMedium, fontSize: 17, color: Colors.offWhite }}>{a.name}</Text>
          <Text numberOfLines={1} style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 0.6, color: 'rgba(255,255,255,0.32)' }}>
            {a.genre.toUpperCase()} · {fmtCount(a.spotters)} SPOTTERS
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
          <Text style={{ fontFamily: FontFamily.monoBold, fontSize: 17, color: '#fff', letterSpacing: -0.4 }}>{a.score}</Text>
          <DeltaPill delta={a.delta} />
        </View>
      </View>
    </PressScale>
  )
}
