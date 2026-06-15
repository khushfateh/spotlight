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
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb4598d050?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['APDHILLON', 'SHUBH', 'KARANAUJLA'],
  },
  {
    id: 'hip-hop',
    label: 'Hip-Hop',
    emoji: '🎤',
    description: 'From street rap to genre-bending crossover',
    coverColor: 'from-gray-800 to-slate-900',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['LILNASX', 'ICESPICE', 'TYLERTC', 'HANUMANKIND'],
  },
  {
    id: 'pop',
    label: 'Pop',
    emoji: '⭐',
    description: 'Mainstream culture-shaping artists at peak relevance',
    coverColor: 'from-pink-500 to-purple-600',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['SABRINA', 'DOJACAT', 'CHARLI', 'NEWJEANS'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    emoji: '🎮',
    description: 'The worlds biggest streamers and gaming personalities',
    coverColor: 'from-violet-600 to-indigo-800',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['KAICENAT', 'SPEED', 'POKIMANE', 'VALKYRAE', 'XQC', 'PDPIE', 'DRDIS'],
  },
  {
    id: 'streaming',
    label: 'Streaming',
    emoji: '📺',
    description: 'Live streaming culture, Twitch and YouTube pioneers',
    coverColor: 'from-purple-600 to-violet-800',
    imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['KAICENAT', 'POKIMANE', 'XQC', 'VALKYRAE'],
  },
  {
    id: 'content',
    label: 'Content Creators',
    emoji: '🎬',
    description: 'YouTube giants, viral creators, and digital entertainment',
    coverColor: 'from-green-500 to-emerald-700',
    imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['MRBEAST', 'CHARLI', 'SIDEMEN', 'CORPSE'],
  },
  {
    id: 'south-asian-culture',
    label: 'South Asian Culture',
    emoji: '🌏',
    description: 'South Asian diaspora shaping global pop culture',
    coverColor: 'from-amber-500 to-orange-600',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['APDHILLON', 'SHUBH', 'KARANAUJLA', 'HANUMANKIND'],
  },
  {
    id: 'latin-music',
    label: 'Latin Music',
    emoji: '🎸',
    description: 'Regional Mexican, reggaeton, and Latin crossover dominance',
    coverColor: 'from-red-500 to-yellow-500',
    imageUrl: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['PESOPLUMA'],
  },
  {
    id: 'k-pop',
    label: 'K-Pop',
    emoji: '🌸',
    description: 'Korean pop culture going fully global',
    coverColor: 'from-pink-400 to-rose-500',
    imageUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['NEWJEANS'],
  },
  {
    id: 'internet-culture',
    label: 'Internet Culture',
    emoji: '🌐',
    description: 'Meme lords, viral moments, and chronically online icons',
    coverColor: 'from-blue-500 to-cyan-600',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['MRBEAST', 'SPEED', 'KAICENAT', 'XQC', 'SIDEMEN'],
  },
  {
    id: 'indie-alt',
    label: 'Indie & Alt',
    emoji: '🎸',
    description: 'Underground sounds and alternative visionaries',
    coverColor: 'from-gray-700 to-slate-800',
    imageUrl: 'https://images.unsplash.com/photo-1527203561368-7521bf25ae49?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['CORPSE', 'TYLERTC', 'LILNASX'],
  },
  {
    id: 'fashion',
    label: 'Fashion & Style',
    emoji: '👗',
    description: 'Taste-making creators defining what culture wears',
    coverColor: 'from-rose-400 to-pink-600',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['CHARLI', 'DOJACAT', 'SABRINA'],
  },
  {
    id: 'film',
    label: 'Film & Visual Art',
    emoji: '🎥',
    description: 'Auteur creators merging music, film, and visual storytelling',
    coverColor: 'from-yellow-600 to-amber-700',
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['TYLERTC', 'LILNASX', 'CORPSE'],
  },
  {
    id: 'sports',
    label: 'Sports & Athletics',
    emoji: '⚡',
    description: 'Athletes, sports creators, and crossover culture',
    coverColor: 'from-orange-500 to-red-600',
    imageUrl: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=800&q=80',
    creatorTickers: ['SIDEMEN', 'SPEED'],
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
