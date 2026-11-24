export type CreatorData = {
  name:     string
  genre:    string
  origin:   string
  bio:      string
  spotters: number
  /** Spotify portrait (same source as web lib/mock-data/creators.ts) */
  imageUrl: string
}

export const CREATORS: Record<string, CreatorData> = {
  APDHILLON:   {
    name: 'AP Dhillon', genre: 'Punjabi Pop', origin: 'Canada / Punjab', spotters: 2841,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebfb505b37709fa86cfd8f55b3',
    bio: 'The defining voice of the Punjabi diaspora. Breaking records globally while staying rooted.',
  },
  KARANAUJLA:  {
    name: 'Karan Aujla', genre: 'Punjabi Hip-Hop', origin: 'Punjab, India', spotters: 1920,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb8a4c60d0eebe893f72e42979',
    bio: 'From underground bars to global stages — raw bars and unfiltered truth.',
  },
  HANUMANKIND: {
    name: 'Hanumankind', genre: 'Hip-Hop', origin: 'Chennai, India', spotters: 1540,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebd5a94f1d05a422f1057b0e90',
    bio: 'Chennai-bred. Chennai-proud. Globally heard. The voice of a generation.',
  },
  SABRINAC:    {
    name: 'Sabrina Carpenter', genre: 'Pop', origin: 'Pennsylvania, USA', spotters: 3210,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb78e45cfa4697ce3c437cb455',
    bio: "Short n' Sweet. Five foot three of pure pop excellence.",
  },
  DOJACAT:     {
    name: 'Doja Cat', genre: 'Pop / R&B', origin: 'Los Angeles, USA', spotters: 4100,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb8a0644455ebfa7d3976f5101',
    bio: 'Iconic. Undeniable. Irreplaceable.',
  },
  TYLERTC:     {
    name: 'Tyler the Creator', genre: 'Hip-Hop', origin: 'Los Angeles, USA', spotters: 3800,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebdf2728294ff77dd11eeb18fb',
    bio: 'Golf. Igor. Chromakopia. Perpetually ahead of the curve.',
  },
  ICESPICE:    {
    name: 'Ice Spice', genre: 'Hip-Hop / Drill', origin: 'New York, USA', spotters: 2900,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebab47bb63dae13065213602cd',
    bio: 'The face of Bronx drill. Undeniable energy, unstoppable momentum.',
  },
  PESOPLUMA:   {
    name: 'Peso Pluma', genre: 'Regional Mexican', origin: 'Guadalajara, Mexico', spotters: 5200,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebe5283f5b671cf618b82a2696',
    bio: 'Redefining regional Mexican music for a generation.',
  },
  NEWJEANS:    {
    name: 'NewJeans', genre: 'K-Pop', origin: 'Seoul, South Korea', spotters: 6800,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb8dae71b664393f38ba91f891',
    bio: 'Casual cool. Effortless pop. A new aesthetic standard.',
  },
  SHUBH:       {
    name: 'Shubh', genre: 'Punjabi Pop', origin: 'Ludhiana, India', spotters: 980,
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb9dfbd284ba8a7d4876a181e3',
    bio: 'Melodic verse meets Punjabi soul. Rising fast.',
  },
}

export function getCreator(ticker: string): (CreatorData & { ticker: string }) | null {
  const data = CREATORS[ticker.toUpperCase()]
  if (!data) return null
  return { ...data, ticker: ticker.toUpperCase() }
}
