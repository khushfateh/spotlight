import { View, Text } from 'react-native'
import { Colors, FontFamily, FontSize } from '@/lib/tokens'

type Props = {
  label?: string
  gold?:  boolean
}

export default function SpottedBadge({ label = '✦ Spotted', gold = false }: Props) {
  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      paddingVertical:  3,
      paddingHorizontal: 9,
      borderRadius:    20,
      backgroundColor: Colors.brassFaint,
      borderWidth:     1,
      borderColor:     'rgba(201,168,76,0.34)',
    }}>
      <Text style={{
        fontFamily:    FontFamily.mono,
        fontSize:      FontSize.label,
        fontWeight:    '700',
        letterSpacing: 0.12,
        textTransform: 'uppercase',
        color:         'rgba(201,168,76,0.9)',
      }}>
        {label}
      </Text>
    </View>
  )
}
