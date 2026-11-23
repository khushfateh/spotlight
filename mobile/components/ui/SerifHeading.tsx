import { Text, type TextStyle, type TextProps } from 'react-native'
import { Colors, FontFamily, FontSize } from '@/lib/tokens'

type Props = TextProps & {
  children:  React.ReactNode
  size?:     keyof typeof FontSize
  color?:    string
  italic?:   boolean
  style?:    TextStyle
}

export default function SerifHeading({
  children,
  size   = 'heading',
  color  = Colors.offWhite,
  italic = false,
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[{
        fontFamily:    italic ? FontFamily.serifItalic : FontFamily.serif,
        fontSize:      FontSize[size],
        color,
        letterSpacing: 0.01,
        lineHeight:    FontSize[size] * 1.08,
      }, style]}
    >
      {children}
    </Text>
  )
}
