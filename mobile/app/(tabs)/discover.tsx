/**
 * Discover — The Observatory.
 *
 *   Find     Who's next? · crystal search · genre crystals · lenses ·
 *            Rising Fast movers
 *   Stage    the golden grand piano, centred like the Home saxophone:
 *            revealed in light, swipe to turn it, dust lifting off it.
 *            The door into Discover Mode.
 *   Editorial  slides up over the piano on dark glass: Near Breakout,
 *            Trending, Editor's Picks, Hidden Gems, All Creators.
 *
 * Behind everything: the web Discover page's living background — the golden
 * threads (a little quicker) and minute star dust.
 *
 * Searching, picking a genre or a lens switches to results mode: the piano
 * bows out and results appear right under the search.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, ScrollView, Dimensions, Platform, RefreshControl, type LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, useAnimatedRef, scrollTo,
  withRepeat, withTiming, withSequence, Easing, FadeInDown, FadeOut,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useIsFocused, useRouter } from 'expo-router'
import { Colors, FontFamily, Spacing } from '@/lib/tokens'
import DiscoverScene3D, { preloadPiano } from '@/components/experience/observatory/DiscoverScene3D'
import { discoverState, getSceneKeepAlive, onSceneKeepAlive } from '@/components/experience/observatory/discoverState'
import SearchField from '@/components/discover/SearchField'
import { GenreTiles, LensChips } from '@/components/discover/Filters'
import { MoverCard, EditorialCard, FeatureCard, RankRow, MOVER_W, EDITORIAL_W } from '@/components/discover/Cards'
import Rail, { SectionHeader } from '@/components/discover/Rail'
import PianoStage from '@/components/discover/PianoStage'
import GoldButton from '@/components/ui/GoldButton'
import RequestArtistModal from '@/components/sheets/RequestArtistModal'
import { useMomentum } from '@/context/MomentumContext'
import { useAuth } from '@/context/AuthContext'
import { logCreatorSearch } from '@/lib/services/signalService'
import {
  buildArtists, risingFast, nearBreakout, trending, hiddenGems, editorsPicks, filterArtists,
  GENRES, LENSES, EDITOR_NOTES, type LensId, type Artist,
} from '@/lib/data/discover'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const TAB_BAR_H = 72

function setSceneScroll(y: number) {
  discoverState.scrollY = y
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { getScore, isLive, refresh } = useMomentum()
  const isFocused = useIsFocused()

  // ── 3D scene lifecycle ─────────────────────────────────────────────────────
  // Start decoding the piano as soon as Discover first opens; the user is in
  // the Find section (piano off-screen) while it loads.
  useEffect(() => { preloadPiano() }, [])
  // Discover Mode (a modal on top) keeps the Observatory alive behind its cards
  const [keepAlive, setKeepAlive] = useState(getSceneKeepAlive())
  useEffect(() => onSceneKeepAlive(setKeepAlive), [])
  const sceneActive = isFocused || keepAlive

  // Device tilt → parallax + piano light
  useEffect(() => {
    if (!isFocused) return
    let sub: { remove: () => void } | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Accelerometer } = require('expo-sensors')
      Accelerometer.setUpdateInterval(50)
      sub = Accelerometer.addListener(({ x, y }: { x: number; y: number }) => {
        discoverState.pointerX = Math.max(-1, Math.min(1, x))
        discoverState.pointerY = Math.max(-1, Math.min(1, y + 0.5))
      })
    } catch {}
    return () => sub?.remove()
  }, [isFocused])

  // ── Data ───────────────────────────────────────────────────────────────────
  const all = useMemo(() => buildArtists(getScore), [getScore])
  const rails = useMemo(() => ({
    rising: risingFast(all),
    breakout: nearBreakout(all),
    trending: trending(all),
    gems: hiddenGems(all),
    picks: editorsPicks(all),
  }), [all])

  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [lens, setLens] = useState<LensId | null>(null)
  const resultsMode = query.trim().length > 0 || !!genre || !!lens
  const results = useMemo(() => filterArtists(all, query, genre, lens), [all, query, genre, lens])

  useEffect(() => { discoverState.stageEnabled = !resultsMode }, [resultsMode])
  useEffect(() => () => { discoverState.stageEnabled = true }, [])

  const onQuery = useCallback((q: string) => {
    setQuery(q)
    discoverState.searchPulse += 1   // the threads shimmer as you type
  }, [])

  // ── Layout: pages + snap points ────────────────────────────────────────────
  const [pageH, setPageH] = useState(SCREEN_H)
  const [stageTop, setStageTop] = useState(SCREEN_H)
  const scrollY = useSharedValue(0)
  const stageTopSV = useSharedValue(SCREEN_H)
  const scrollRef = useAnimatedRef<ScrollView>()

  const onScrollLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height)
    if (h > 0) { setPageH(h); discoverState.pageH = h }
  }, [])
  const onFindLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height)
    if (h > 0) { setStageTop(h); stageTopSV.value = h; discoverState.stageTop = h }
  }, [stageTopSV])

  const editorialSnap = stageTop + pageH - insets.top - 6
  const snaps = useMemo(
    () => (resultsMode ? undefined : [0, stageTop, editorialSnap]),
    [resultsMode, stageTop, editorialSnap],
  )

  // Haptic tick when the page settles on a new section
  const lastSection = useRef(0)
  const onSettle = useCallback((y: number) => {
    if (!snaps) return
    let best = 0
    snaps.forEach((s, i) => { if (Math.abs(s - y) < Math.abs(snaps[best] - y)) best = i })
    if (Math.abs(snaps[best] - y) > 4) return
    if (best !== lastSection.current) {
      lastSection.current = best
      if (Platform.OS !== 'web') Haptics.selectionAsync()
    }
  }, [snaps])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y
      scheduleOnRN(setSceneScroll, e.contentOffset.y)
    },
    onMomentumEnd: (e) => {
      scheduleOnRN(onSettle, e.contentOffset.y)
    },
  })

  const scrollToTop = useCallback(() => {
    scheduleOnUI(() => {
      'worklet'
      scrollTo(scrollRef, 0, 0, true)
    })
  }, [scrollRef])

  // ── Actions ────────────────────────────────────────────────────────────────
  const openArtist = useCallback((a: Artist) => {
    if (query.trim()) logCreatorSearch(a.ticker, query.trim(), user?.id)
    router.push(`/creator/${a.ticker}`)
  }, [router, query, user?.id])

  const seeAll = useCallback((id: LensId) => {
    setLens(id)
    setGenre(null)
    scrollToTop()
  }, [scrollToTop])

  const clearAll = useCallback(() => {
    setQuery('')
    setGenre(null)
    setLens(null)
  }, [])

  const [requestVisible, setRequestVisible] = useState(false)
  const [requestQuery, setRequestQuery] = useState('')
  const openRequest = useCallback((q = '') => {
    setRequestQuery(q)
    setRequestVisible(true)
  }, [])

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await refresh() } finally { setRefreshing(false) }
  }, [refresh])

  const chromeBottom = insets.bottom + TAB_BAR_H

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      {/* ── The Observatory: threads, star dust, the piano ──────────────── */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: W, height: SCREEN_H }} pointerEvents="none">
        <DiscoverScene3D width={W} height={SCREEN_H} active={sceneActive} />
      </View>

      <AnimatedScrollView
        ref={scrollRef}
        onLayout={onScrollLayout}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToOffsets={snaps}
        snapToEnd={false}
        decelerationRate={resultsMode ? 'normal' : 'fast'}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brass} progressViewOffset={insets.top} />}
        style={{ flex: 1 }}
      >
        {/* ── 01 · Find ───────────────────────────────────────────────────── */}
        <View onLayout={onFindLayout} style={{ minHeight: resultsMode ? undefined : pageH, paddingTop: insets.top + 14 }}>
          {/* The page arrives in sequence: words, search, genres, lenses, movers */}
          <Animated.View entering={enter(0)} style={{ paddingHorizontal: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2, color: Colors.brassDim }}>
                ◆ THE OBSERVATORY
              </Text>
              <LiveBadge live={isLive} />
            </View>
            <Text style={{ fontFamily: FontFamily.serif, fontSize: 48, lineHeight: 54, color: Colors.offWhite, marginTop: 10 }}>
              Who's <Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>next?</Text>
            </Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 11, lineHeight: 17, letterSpacing: 0.2, color: 'rgba(255,255,255,0.42)', marginTop: 4 }}>
              Discover tomorrow's cultural icons{'\n'}before the world does.
            </Text>
          </Animated.View>
          <Animated.View entering={enter(1)} style={{ paddingHorizontal: Spacing.lg, marginTop: 20 }}>
            <SearchField value={query} onChangeText={onQuery} />
          </Animated.View>

          <Animated.View entering={enter(2)}>
            <Text style={labelStyle}>GENRES</Text>
            <GenreTiles active={genre} onSelect={setGenre} />
          </Animated.View>

          <Animated.View entering={enter(3)}>
            <Text style={labelStyle}>DISCOVERY LENS</Text>
            <LensChips active={lens} onSelect={setLens} />
          </Animated.View>

          {!resultsMode && (
            <Animated.View entering={enter(4)} exiting={FadeOut.duration(160)} style={{ marginTop: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: '#34d399', fontSize: 10 }}>↗</Text>
                  <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.6, color: '#34d399' }}>RISING FAST · THIS WEEK</Text>
                </View>
                <Text onPress={() => seeAll('rising')} suppressHighlighting style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)' }}>
                  SEE ALL →
                </Text>
              </View>
              <ScrollView
                horizontal
                style={{ flexGrow: 0 }}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={MOVER_W + 10}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 10 }}
              >
                {rails.rising.map((a) => <MoverCard key={a.ticker} a={a} onPress={() => openArtist(a)} />)}
              </ScrollView>
            </Animated.View>
          )}

          {!resultsMode && (
            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 18, paddingBottom: chromeBottom + 12 }}>
              <ScrollCue />
            </View>
          )}
        </View>

        {resultsMode ? (
          <Results
            results={results}
            query={query}
            genre={genre}
            lens={lens}
            bottom={chromeBottom + 40}
            onOpen={openArtist}
            onClearQuery={() => setQuery('')}
            onClearGenre={() => setGenre(null)}
            onClearLens={() => setLens(null)}
            onClearAll={clearAll}
            onRequest={openRequest}
          />
        ) : (
          <>
            {/* ── 02 · The piano's stage ─────────────────────────────────── */}
            <PianoStage
              height={pageH}
              topInset={insets.top}
              bottomInset={insets.bottom}
              scrollY={scrollY}
              stageTop={stageTopSV}
              onEnterDiscoverMode={() => router.push('/discover-mode')}
              hidden={keepAlive}
            />

            {/* ── 03 · Editorial discovery, on dark glass over the piano ──── */}
            <View style={{
              minHeight: pageH,
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              backgroundColor: 'rgba(6,5,10,0.92)',
              borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
              borderColor: 'rgba(201,168,76,0.2)',
              paddingTop: 12,
              paddingBottom: chromeBottom + 48,
            }}>
              <View style={{ alignSelf: 'center', width: 36, height: 3, borderRadius: 2, backgroundColor: 'rgba(201,168,76,0.35)', marginBottom: 22 }} />

              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: 30 }}>
                <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2, color: Colors.brassDim }}>── EDITORIAL DISCOVERY</Text>
                <Text style={{ fontFamily: FontFamily.serif, fontSize: 40, lineHeight: 45, color: Colors.offWhite, marginTop: 10 }}>
                  Curated for the{'\n'}<Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>early ear.</Text>
                </Text>
              </View>

              <Rail glyph="⚡" eyebrow="Near Breakout" color={Colors.brass} title="About to" accent="break through"
                description="Within a few points of the next momentum tier." itemWidth={EDITORIAL_W} onSeeAll={() => seeAll('breakout')}>
                {rails.breakout.map((a) => (
                  <EditorialCard key={a.ticker} a={a} accent={{ color: Colors.brass, badge: '↑ BREAKOUT' }} showNextTier onPress={() => openArtist(a)} />
                ))}
              </Rail>

              <View style={{ height: 40 }} />
              <Rail glyph="◆" eyebrow="Trending" color="#fb923c" title="Highest" accent="momentum"
                description="The strongest scores on SPOTLIGHT right now." itemWidth={EDITORIAL_W} onSeeAll={() => seeAll('trending')}>
                {rails.trending.map((a) => (
                  <EditorialCard key={a.ticker} a={a} accent={{ color: '#fb923c', badge: '◆ TRENDING' }} onPress={() => openArtist(a)} />
                ))}
              </Rail>

              <View style={{ height: 40 }} />
              <SectionHeader glyph="★" eyebrow="Editor's Picks" color="#a78bfa" title="Hand-picked" accent="by us"
                description="The SPOTLIGHT team's ones to watch." onSeeAll={() => seeAll('editors')} />
              <ScrollView
                horizontal
                style={{ flexGrow: 0 }}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={W - Spacing.lg * 2 + 12}
                contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 12 }}
              >
                {rails.picks.map((a) => (
                  <FeatureCard key={a.ticker} a={a} note={EDITOR_NOTES[a.ticker] ?? ''} width={W - Spacing.lg * 2} onPress={() => openArtist(a)} />
                ))}
              </ScrollView>

              <View style={{ height: 40 }} />
              <Rail glyph="◇" eyebrow="Hidden Gems" color="#60a5fa" title="Under the" accent="radar"
                description="Accelerating fast, still spotted by few." itemWidth={EDITORIAL_W} onSeeAll={() => seeAll('gems')}>
                {rails.gems.map((a) => (
                  <EditorialCard key={a.ticker} a={a} accent={{ color: '#60a5fa', badge: '◇ GEM' }} onPress={() => openArtist(a)} />
                ))}
              </Rail>

              <View style={{ height: 44 }} />
              <SectionHeader glyph="◈" eyebrow="All Creators" color={Colors.brassDim} title="Ranked by" accent="momentum"
                description={isLive ? 'Live scores, refreshed every few minutes.' : 'Last known scores — pull down to refresh.'} />
              <View style={{ paddingHorizontal: Spacing.lg }}>
                {all.map((a, i) => <RankRow key={a.ticker} a={a} rank={i + 1} onPress={() => openArtist(a)} />)}
              </View>

              <RequestFooter onRequest={() => openRequest('')} />
            </View>
          </>
        )}
      </AnimatedScrollView>

      {/* Status-bar legibility over the moving background */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(5,5,8,0.92)', 'rgba(5,5,8,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 18 }}
      />

      <RequestArtistModal visible={requestVisible} onClose={() => setRequestVisible(false)} initialQuery={requestQuery} />
    </View>
  )
}

/** Staggered entrance for the Find section */
const enter = (i: number) => FadeInDown.delay(80 + i * 90).duration(620).easing(Easing.out(Easing.cubic))

const labelStyle = {
  fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.8, color: 'rgba(255,255,255,0.32)',
  paddingHorizontal: Spacing.lg, marginTop: 22, marginBottom: 10,
} as const

// ── Live momentum badge ─────────────────────────────────────────────────────
function LiveBadge({ live }: { live: boolean }) {
  const pulse = useSharedValue(1)
  useEffect(() => {
    if (!live) return
    pulse.value = withRepeat(withSequence(withTiming(0.25, { duration: 900 }), withTiming(1, { duration: 900 })), -1)
  }, [live, pulse])
  const dot = useAnimatedStyle(() => ({ opacity: pulse.value }))
  const c = live ? '#52d78a' : 'rgba(255,255,255,0.35)'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, height: 20, borderRadius: 10, borderWidth: 1, borderColor: live ? 'rgba(82,215,138,0.3)' : 'rgba(255,255,255,0.1)' }}>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }, dot]} />
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 8, letterSpacing: 1.2, color: c }}>{live ? 'LIVE' : 'LAST KNOWN'}</Text>
    </View>
  )
}

// ── "The instrument awaits" — invites the scroll down to the piano ──────────
function ScrollCue() {
  const bob = useSharedValue(0)
  useEffect(() => {
    bob.value = withRepeat(withSequence(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
    ), -1)
  }, [bob])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * 6 }], opacity: 0.55 + bob.value * 0.35 }))
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 2.4, color: Colors.brassDim }}>THE INSTRUMENT AWAITS</Text>
      <Animated.View style={style}>
        <View style={{ width: 1, height: 22, backgroundColor: Colors.brass, opacity: 0.7, alignSelf: 'center' }} />
        <Text style={{ color: Colors.brass, fontSize: 10, marginTop: -4, textAlign: 'center' }}>⌄</Text>
      </Animated.View>
    </View>
  )
}

function RequestFooter({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 36, paddingHorizontal: Spacing.lg, gap: 14 }}>
      <Text style={{ fontFamily: FontFamily.serif, fontSize: 22, color: 'rgba(255,255,255,0.72)', textAlign: 'center' }}>
        Don't see your artist?
      </Text>
      <GoldButton onPress={onRequest} variant="outline">Request an artist</GoldButton>
    </View>
  )
}

// ── Results mode ────────────────────────────────────────────────────────────
function Results({
  results, query, genre, lens, bottom, onOpen, onClearQuery, onClearGenre, onClearLens, onClearAll, onRequest,
}: {
  results: Artist[]
  query: string
  genre: string | null
  lens: LensId | null
  bottom: number
  onOpen: (a: Artist) => void
  onClearQuery: () => void
  onClearGenre: () => void
  onClearLens: () => void
  onClearAll: () => void
  onRequest: (q?: string) => void
}) {
  const g = genre ? GENRES.find((x) => x.id === genre) : null
  const l = lens ? LENSES.find((x) => x.id === lens) : null
  const q = query.trim()
  return (
    <View style={{ paddingHorizontal: Spacing.lg, paddingTop: 24, paddingBottom: bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.6, color: Colors.brassDim, marginRight: 4 }}>
          {results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}
        </Text>
        {q ? <FilterTag label={`“${q}”`} onClear={onClearQuery} /> : null}
        {g ? <FilterTag label={g.label} onClear={onClearGenre} /> : null}
        {l ? <FilterTag label={l.label} color={l.color} onClear={onClearLens} /> : null}
        <View style={{ flex: 1 }} />
        <Text onPress={onClearAll} suppressHighlighting style={{ fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)' }}>
          CLEAR
        </Text>
      </View>
      {l && (
        <Text style={{ fontFamily: FontFamily.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{l.description}</Text>
      )}

      {results.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(380)} style={{ alignItems: 'center', paddingTop: 40, gap: 14 }}>
          <Text style={{ fontFamily: FontFamily.serif, fontSize: 28, lineHeight: 33, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
            {q ? <>No one called “{q}”{'\n'}<Text style={{ fontFamily: FontFamily.serifItalic, color: Colors.brass }}>— yet.</Text></> : 'Nothing matches these filters.'}
          </Text>
          {q ? (
            <>
              <Text style={{ fontFamily: FontFamily.mono, fontSize: 10, color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 16 }}>
                Request them and you'll be first in line{'\n'}when they arrive on SPOTLIGHT.
              </Text>
              <GoldButton onPress={() => onRequest(q)} shimmer>Request “{q.length > 18 ? q.slice(0, 18) + '…' : q}”</GoldButton>
            </>
          ) : null}
          <GoldButton onPress={onClearAll} variant="outline">Clear filters</GoldButton>
        </Animated.View>
      ) : (
        results.map((a, i) => (
          <Animated.View key={a.ticker} entering={FadeInDown.delay(Math.min(i, 8) * 35).duration(360)}>
            <RankRow a={a} rank={i + 1} onPress={() => onOpen(a)} />
          </Animated.View>
        ))
      )}

      {results.length > 0 && q ? (
        <Text onPress={() => onRequest(q)} suppressHighlighting style={{ fontFamily: FontFamily.mono, fontSize: 10, letterSpacing: 0.6, color: Colors.brassDim, textAlign: 'center', marginTop: 24 }}>
          ◇ Not who you meant? Request “{q}” →
        </Text>
      ) : null}
    </View>
  )
}

function FilterTag({ label, color = Colors.brass, onClear }: { label: string; color?: string; onClear: () => void }) {
  return (
    <Text
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync()
        onClear()
      }}
      suppressHighlighting
      style={{
        fontFamily: FontFamily.mono, fontSize: 9, letterSpacing: 0.8, color,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: `${color}55`, overflow: 'hidden',
      }}
    >
      {label}  ×
    </Text>
  )
}
