import { View, type ViewStyle, type ViewProps } from 'react-native'
import { BlurView } from 'expo-blur'
import { Colors, Radius } from '@/lib/tokens'

type Props = ViewProps & {
  children:   React.ReactNode
  style?:     ViewStyle
  intensity?: number
  bordered?:  boolean
  goldBorder?: boolean
  glow?:      boolean
  padding?:   number
}

export default function GlassCard({
  children,
  style,
  intensity   = 24,
  bordered    = true,
  goldBorder  = false,
  glow        = false,
  padding,
  ...rest
}: Props) {
  const borderColor = goldBorder
    ? 'rgba(201,168,76,0.18)'
    : 'rgba(255,255,255,0.07)'

  return (
    <View
      {...rest}
      style={[{
        borderRadius: Radius.sharp,
        overflow:     'hidden',
        borderWidth:  bordered ? 1 : 0,
        borderColor,
        ...(glow ? {
          shadowColor:   Colors.brass,
          shadowOffset:  { width: 0, height: 0 },
          shadowOpacity: 0.14,
          shadowRadius:  12,
          elevation:     4,
        } : {}),
      }, style]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{
          flex:            1,
          backgroundColor: 'rgba(5,5,8,0.88)',
        }}
      >
        {padding !== undefined ? (
          <View style={{ padding }}>
            {children}
          </View>
        ) : children}
      </BlurView>
    </View>
  )
}
