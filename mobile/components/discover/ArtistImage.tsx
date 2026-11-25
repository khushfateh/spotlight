/** Remote portrait that fades in over a warm placeholder (never a hard pop). */
import { useState } from 'react'
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

type Props = {
  uri: string
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
  /** focal point: 'top' keeps faces in frame on tall crops */
  align?: 'center' | 'top'
}

export default function ArtistImage({ uri, style, imageStyle, align = 'center' }: Props) {
  const op = useSharedValue(0)
  const [failed, setFailed] = useState(false)
  const anim = useAnimatedStyle(() => ({ opacity: op.value }))
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#14100a' }, style]}>
      {!failed && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, anim]}>
          <Image
            source={{ uri }}
            onLoad={() => { op.value = withTiming(1, { duration: 420 }) }}
            onError={() => setFailed(true)}
            resizeMode="cover"
            style={[{ width: '100%', height: align === 'top' ? '118%' : '100%' }, imageStyle]}
          />
        </Animated.View>
      )}
    </View>
  )
}
