import { View, Text } from 'react-native'
import { Colors, FontFamily, FontSize, Radius } from '@/lib/tokens'

type Tier = 'Icon' | 'Viral' | 'Breakout' | 'Heating Up' | 'Rising' | 'Emerging'

const TIER_CONFIG: Record<Tier, { color: string; bg: string; symbol: string }> = {
  'Icon':       { color: Colors.brass,     bg: 'rgba(201,168,76,0.14)',  symbol: '◈' },
  'Viral':      { color: '#fb923c',        bg: 'rgba(251,146,60,0.12)',  symbol: '◉' },
  'Breakout':   { color: '#34d399',        bg: 'rgba(52,211,153,0.11)',  symbol: '◎' },
  'Heating Up': { color: '#60a5fa',        bg: 'rgba(96,165,250,0.11)',  symbol: '◇' },
  'Rising':     { color: '#a78bfa',        bg: 'rgba(167,139,250,0.11)', symbol: '◦' },
  'Emerging':   { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)', symbol: '·' },
}

type Props = {
  tier:  string
  size?: 'sm' | 'md'
  delta?: number
}

export default function MomentumBadge({ tier, size = 'md', delta }: Props) {
  const cfg = TIER_CONFIG[tier as Tier] ?? TIER_CONFIG['Emerging']
  const fontSize = size === 'sm' ? 7 : FontSize.label

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        gap:              4,
        backgroundColor:  cfg.bg,
        paddingVertical:  3,
        paddingHorizontal: 7,
        borderRadius:     Radius.sharp,
        borderWidth:      1,
        borderColor:      `${cfg.color}30`,
      }}>
        <Text style={{ color: cfg.color, fontSize: fontSize + 1, lineHeight: fontSize + 3 }}>
          {cfg.symbol}
        </Text>
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      fontSize,
          color:         cfg.color,
          letterSpacing: 0.1,
          textTransform: 'uppercase',
        }}>
          {tier}
        </Text>
      </View>

      {delta !== undefined && delta > 0 && (
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      fontSize,
          color:         Colors.success,
          letterSpacing: 0.08,
        }}>
          +{delta} this week
        </Text>
      )}
    </View>
  )
}
