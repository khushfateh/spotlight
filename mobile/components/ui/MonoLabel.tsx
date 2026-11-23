import { Text, type TextStyle, type TextProps } from 'react-native'
import { Colors, FontFamily, FontSize } from '@/lib/tokens'

type Props = TextProps & {
  children: React.ReactNode
  size?:    keyof typeof FontSize
  color?:   string
  style?:   TextStyle
  uppercase?: boolean
  tracking?:  number
}

export default function MonoLabel({
  children,
  size     = 'label',
  color    = Colors.brassDim,
  uppercase = true,
  tracking  = 0.28,
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[{
        fontFamily:    FontFamily.mono,
        fontSize:      FontSize[size],
        color,
        letterSpacing: tracking,
        textTransform: uppercase ? 'uppercase' : 'none',
      }, style]}
    >
      {children}
    </Text>
  )
}
