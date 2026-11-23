import { View } from 'react-native'
import { Colors } from '@/lib/tokens'

export default function GoldDivider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: Colors.brassFaint }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(201,168,76,0.22)', marginHorizontal: 10 }} />
      <View style={{ flex: 1, height: 1, backgroundColor: Colors.brassFaint }} />
    </View>
  )
}
