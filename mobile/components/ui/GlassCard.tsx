import { View, type ViewStyle, type ViewProps } from 'react-native'
import { BlurView } from 'expo-blur'
import { Colors, Radius } from '@/lib/tokens'

type Props = ViewProps & {
  children:    React.ReactNode
  style?:      ViewStyle
  intensity?:  number
  bordered?:   boolean
  goldBorder?: boolean
}

export default function GlassCard({
  children,
  style,
  intensity   = 20,
  bordered    = true,
  goldBorder  = false,
  ...rest
}: Props) {
  return (
    <View
      {...rest}
      style={[{
        borderRadius: Radius.sharp,
        overflow:     'hidden',
        borderWidth:  bordered ? 1 : 0,
        borderColor:  goldBorder ? Colors.glassBorder : 'rgba(255,255,255,0.07)',
      }, style]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{
          flex:            1,
          backgroundColor: Colors.glass,
        }}
      >
        {children}
      </BlurView>
    </View>
  )
}
