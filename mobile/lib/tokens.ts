// SPOTLIGHT Design Tokens — single source of truth for the mobile app.
// Mirrors the web's CSS custom properties exactly.

export const Colors = {
  void:        '#050508',
  brass:       '#C9A84C',
  brassLight:  '#E8C96A',
  brassDim:    'rgba(201,168,76,0.45)',
  brassFaint:  'rgba(201,168,76,0.12)',
  brassGlow:   'rgba(201,168,76,0.25)',

  white:       '#FFFFFF',
  offWhite:    'rgba(255,255,255,0.88)',
  dimWhite:    'rgba(255,255,255,0.55)',
  faintWhite:  'rgba(255,255,255,0.12)',

  success:     '#52d78a',
  error:       '#e05555',

  glass:       'rgba(5,5,8,0.92)',
  glassBorder: 'rgba(201,168,76,0.14)',
  glassFocus:  'rgba(201,168,76,0.45)',

  // Surface levels
  surface0: '#050508',   // void
  surface1: '#0a0a0f',   // cards
  surface2: '#111118',   // elevated
} as const

export const FontFamily = {
  serif: 'CormorantGaramond_300Light',
  serifItalic: 'CormorantGaramond_300Light_Italic',
  serifMedium: 'CormorantGaramond_500Medium',
  mono:  'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const

export const FontSize = {
  label:    8,
  caption:  10,
  body:     13,
  bodyLg:   15,
  title:    22,
  heading:  32,
  display:  48,
  hero:     64,
} as const

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  section: 64,
} as const

export const Radius = {
  sharp: 2,
  sm:    4,
  md:    8,
  pill:  9999,
} as const

export const Shadow = {
  gold: {
    shadowColor: Colors.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  goldStrong: {
    shadowColor: Colors.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  },
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.72,
    shadowRadius: 32,
    elevation: 20,
  },
} as const

export const ZIndex = {
  canvas:  0,
  base:    1,
  overlay: 10,
  modal:   100,
  toast:   200,
} as const

// Animation durations
export const Duration = {
  instant:  120,
  fast:     220,
  medium:   380,
  slow:     600,
  breathe:  4500,
  float:    7000,
} as const

// Extra color helpers
export const Gradient = {
  brassVertical:   ['rgba(201,168,76,0.18)', 'rgba(201,168,76,0)'] as string[],
  brassRadial:     ['rgba(201,168,76,0.28)', 'rgba(201,168,76,0)'] as string[],
  voidFade:        ['transparent', '#050508'] as string[],
  voidFadeReverse: ['#050508', 'transparent'] as string[],
} as const
