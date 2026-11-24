import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/lib/tokens'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassCard from '@/components/ui/GlassCard'
import GoldDivider from '@/components/ui/GoldDivider'
import GoldButton from '@/components/ui/GoldButton'

type Notification = {
  id:      string
  type:    'momentum' | 'milestone' | 'system'
  ticker?: string
  title:   string
  body:    string
  time:    string
  isRead:  boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'momentum', ticker: 'APDHILLON',
    title: 'AP Dhillon hit 90+ score',
    body: 'An artist you spotted just broke into Icon tier. Your early call is in the vault.',
    time: '2h ago', isRead: false,
  },
  {
    id: '2', type: 'milestone', ticker: 'HANUMANKIND',
    title: 'You were Spotter #847',
    body: 'Hanumankind just crossed 1,000 spotters. You were ahead of the crowd.',
    time: '1d ago', isRead: false,
  },
  {
    id: '3', type: 'system',
    title: 'Welcome to SPOTLIGHT',
    body: 'Your cultural legacy starts here. Spot artists before the world does.',
    time: '3d ago', isRead: true,
  },
]

const TYPE_ICON: Record<Notification['type'], string> = {
  momentum:  '◆',
  milestone: '◈',
  system:    '◇',
}

const TYPE_COLOR: Record<Notification['type'], string> = {
  momentum:  '#fb923c',
  milestone: Colors.brass,
  system:    'rgba(255,255,255,0.4)',
}

function NotificationRow({ item, index }: { item: Notification; index: number }) {
  const enterOp = useSharedValue(0)
  const enterY  = useSharedValue(12)

  useEffect(() => {
    const delay = index * 70
    enterOp.value = withDelay(delay, withTiming(1, { duration: 480 }))
    enterY.value  = withDelay(delay, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }))
  }, [index])

  const style = useAnimatedStyle(() => ({
    opacity:   enterOp.value,
    transform: [{ translateY: enterY.value }],
  }))

  return (
    <Animated.View style={[style, { marginBottom: Spacing.sm }]}>
      <GlassCard
        goldBorder={!item.isRead}
        glow={!item.isRead}
        style={{ opacity: item.isRead ? 0.6 : 1 }}
      >
        <View style={{ padding: Spacing.md, flexDirection: 'row', gap: Spacing.md }}>
          {/* Icon */}
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: `${TYPE_COLOR[item.type]}12`,
            borderWidth: 1,
            borderColor:  `${TYPE_COLOR[item.type]}28`,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Text style={{ color: TYPE_COLOR[item.type], fontSize: 14 }}>
              {TYPE_ICON[item.type]}
            </Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{
                fontFamily:    FontFamily.mono,
                fontSize:      FontSize.caption,
                color:         item.isRead ? Colors.dimWhite : Colors.offWhite,
                letterSpacing: 0.03,
                flex:          1,
                marginRight:   Spacing.sm,
              }}>
                {item.title}
              </Text>
              <MonoLabel size="label" color="rgba(255,255,255,0.22)">
                {item.time}
              </MonoLabel>
            </View>
            <Text style={{
              fontFamily:    FontFamily.mono,
              fontSize:      FontSize.label,
              color:         'rgba(255,255,255,0.35)',
              letterSpacing: 0.03,
              lineHeight:    16,
            }}>
              {item.body}
            </Text>
            {item.ticker && !item.isRead && (
              <MonoLabel size="label" color={Colors.brassDim} style={{ marginTop: 5 }}>
                {item.ticker}
              </MonoLabel>
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  )
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const unread = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length

  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + Spacing.sm,
          left: Spacing.lg,
          zIndex: 20,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'rgba(5,5,8,0.7)',
          borderWidth: 1, borderColor: 'rgba(201,168,76,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}
        hitSlop={8}
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, lineHeight: 24 }}>‹</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingTop:        insets.top + Spacing.xl + 20,
          paddingHorizontal: Spacing.lg,
          paddingBottom:     Spacing.md,
        }}>
          <MonoLabel size="label" style={{ marginBottom: 8 }}>◆ Activity</MonoLabel>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm }}>
            <Text style={{
              fontFamily:    FontFamily.serif,
              fontSize:      FontSize.heading,
              color:         Colors.offWhite,
              letterSpacing: 0.01,
            }}>
              Notifications
            </Text>
            {unread > 0 && (
              <View style={{
                backgroundColor: Colors.brass,
                borderRadius: Radius.pill,
                paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{
                  fontFamily:    FontFamily.monoBold,
                  fontSize:      8,
                  color:         '#080604',
                  letterSpacing: 0.1,
                }}>
                  {unread}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* List */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <GoldDivider style={{ marginBottom: Spacing.md }} />

          {MOCK_NOTIFICATIONS.length === 0 ? (
            <View style={{ paddingTop: Spacing.section, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(201,168,76,0.18)', fontSize: 40, marginBottom: 20 }}>◇</Text>
              <Text style={{
                fontFamily: FontFamily.serif,
                fontSize:   FontSize.title,
                color:      'rgba(255,255,255,0.4)',
                textAlign:  'center',
              }}>
                No notifications yet
              </Text>
            </View>
          ) : (
            MOCK_NOTIFICATIONS.map((item, i) => (
              <NotificationRow key={item.id} item={item} index={i} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
