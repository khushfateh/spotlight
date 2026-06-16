export type Genre = {
  id: string
  label: string
  emoji: string
  description: string
  coverColor: string
  imageUrl?: string
  creatorTickers: string[]
}

export const genres: Genre[] = [
  {
    id: 'punjabi-music',
    label: 'Punjabi Music',
    emoji: '🎵',
    description: 'Bhangra beats, R&B fusion, and South Asian diaspora sound',
    coverColor: 'from-orange-500 to-pink-600',
    // Vibrant crowd at outdoor festival, warm amber/orange stage wash
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['APDHILLON', 'SHUBH', 'KARANAUJLA'],
  },
  {
    id: 'hip-hop',
    label: 'Hip-Hop',
    emoji: '🎤',
    description: 'From street rap to genre-bending crossover',
    coverColor: 'from-gray-800 to-slate-900',
    // Dark stage performance, single spotlight, gritty energy
    imageUrl: 'https://images.unsplash.com/photo-1571609249584-cfbd1daecd08?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['LILNASX', 'ICESPICE', 'TYLERTC', 'HANUMANKIND'],
  },
  {
    id: 'pop',
    label: 'Pop',
    emoji: '⭐',
    description: 'Mainstream culture-shaping artists at peak relevance',
    coverColor: 'from-pink-500 to-purple-600',
    // Stadium crowd, thousands of hands raised, bokeh confetti
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b4a3163?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['SABRINA', 'DOJACAT', 'NEWJEANS'],
  },
  {
    id: 'content',
    label: 'Content Creators',
    emoji: '🎬',
    description: 'YouTube giants, viral creators, and digital entertainment',
    coverColor: 'from-green-500 to-emerald-700',
    // Podcast/recording setup, professional mic in dark creative space
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['CORPSE'],
  },
  {
    id: 'south-asian-culture',
    label: 'South Asian Culture',
    emoji: '🌏',
    description: 'South Asian diaspora shaping global pop culture',
    coverColor: 'from-amber-500 to-orange-600',
    // Holi festival — explosive burst of color
    imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['APDHILLON', 'SHUBH', 'KARANAUJLA', 'HANUMANKIND'],
  },
  {
    id: 'latin-music',
    label: 'Latin Music',
    emoji: '🎸',
    description: 'Regional Mexican, reggaeton, and Latin crossover dominance',
    coverColor: 'from-red-500 to-yellow-500',
    // Intimate Latin guitar performance, warm candlelit stage
    imageUrl: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['PESOPLUMA', 'BUNNY', 'KAROLG', 'BALVIN', 'OZUNA'],
  },
  {
    id: 'k-pop',
    label: 'K-Pop',
    emoji: '🌸',
    description: 'Korean pop culture going fully global',
    coverColor: 'from-pink-400 to-rose-500',
    // Seoul at night, electric neon signs, pink/blue glow
    imageUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['NEWJEANS', 'BPINK', 'SKIDS', 'AESPA', 'BTS'],
  },
  {
    id: 'afrobeats',
    label: 'Afrobeats',
    emoji: '🥁',
    description: 'West African sounds taking over global playlists',
    coverColor: 'from-yellow-500 to-orange-600',
    // West African djembe drums, warm sunset glow, rhythmic energy
    imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['BURNA', 'WIZKID', 'TEMS', 'DAVIDO'],
  },
  {
    id: 'r-and-b',
    label: 'R&B & Soul',
    emoji: '🎷',
    description: 'Neo-soul, alt-R&B, and next-gen soulful sounds',
    coverColor: 'from-indigo-500 to-violet-700',
    // Moody intimate concert, warm amber single spotlight, haze
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['SZA', 'WEEKND', 'HER', 'GIVEON', 'DOJACAT'],
  },
  {
    id: 'electronic',
    label: 'Electronic',
    emoji: '🎛️',
    description: 'EDM, future bass, and experimental electronic frontiers',
    coverColor: 'from-cyan-500 to-blue-600',
    // Festival mainstage — laser beams slicing through a massive crowd
    imageUrl: 'https://images.unsplash.com/photo-1549247779-b93bbed26fc0?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['SKRLL', 'DIPLO', 'PORTER', 'FLUME'],
  },
  {
    id: 'indie-alt',
    label: 'Indie & Alt',
    emoji: '🎸',
    description: 'Underground sounds and alternative visionaries',
    coverColor: 'from-gray-700 to-slate-800',
    // Small intimate venue, warm low tungsten light, raw grain
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['CORPSE', 'TYLERTC', 'LILNASX'],
  },
  {
    id: 'fashion',
    label: 'Fashion & Style',
    emoji: '👗',
    description: 'Taste-making creators defining what culture wears',
    coverColor: 'from-rose-400 to-pink-600',
    // Bold editorial fashion — high contrast, architectural lines
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['DOJACAT', 'SABRINA'],
  },
  {
    id: 'film',
    label: 'Film & Visual Art',
    emoji: '🎥',
    description: 'Auteur creators merging music, film, and visual storytelling',
    coverColor: 'from-yellow-600 to-amber-700',
    // Cinema screen at night, wide shot, deep cinematic blue
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80',
    creatorTickers: ['TYLERTC', 'LILNASX', 'CORPSE'],
  },
]

export function getGenreById(id: string): Genre | undefined {
  return genres.find(g => g.id === id)
}

export function getGenresForCreator(ticker: string): Genre[] {
  return genres.filter(g => g.creatorTickers.includes(ticker.toUpperCase()))
}

export function getCreatorsInGenre(genreId: string): string[] {
  return genres.find(g => g.id === genreId)?.creatorTickers ?? []
}
