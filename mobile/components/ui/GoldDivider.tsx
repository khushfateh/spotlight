import { View, type ViewStyle } from 'react-native'
import { Colors } from '@/lib/tokens'

export default function GoldDivider({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: Colors.brassFaint }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(201,168,76,0.22)', marginHorizontal: 10 }} />
      <View style={{ flex: 1, height: 1, backgroundColor: Colors.brassFaint }} />
    </View>
  )
}
