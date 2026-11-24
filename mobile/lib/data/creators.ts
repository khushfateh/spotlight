export type CreatorData = {
  name:     string
  genre:    string
  origin:   string
  bio:      string
  spotters: number
}

export const CREATORS: Record<string, CreatorData> = {
  APDHILLON:   {
    name: 'AP Dhillon', genre: 'Punjabi Pop', origin: 'Canada / Punjab', spotters: 2841,
    bio: 'The defining voice of the Punjabi diaspora. Breaking records globally while staying rooted.',
  },
  KARANAUJLA:  {
    name: 'Karan Aujla', genre: 'Punjabi Hip-Hop', origin: 'Punjab, India', spotters: 1920,
    bio: 'From underground bars to global stages — raw bars and unfiltered truth.',
  },
  HANUMANKIND: {
    name: 'Hanumankind', genre: 'Hip-Hop', origin: 'Chennai, India', spotters: 1540,
    bio: 'Chennai-bred. Chennai-proud. Globally heard. The voice of a generation.',
  },
  SABRINAC:    {
    name: 'Sabrina Carpenter', genre: 'Pop', origin: 'Pennsylvania, USA', spotters: 3210,
    bio: "Short n' Sweet. Five foot three of pure pop excellence.",
  },
  DOJACAT:     {
    name: 'Doja Cat', genre: 'Pop / R&B', origin: 'Los Angeles, USA', spotters: 4100,
    bio: 'Iconic. Undeniable. Irreplaceable.',
  },
  TYLERTC:     {
    name: 'Tyler the Creator', genre: 'Hip-Hop', origin: 'Los Angeles, USA', spotters: 3800,
    bio: 'Golf. Igor. Chromakopia. Perpetually ahead of the curve.',
  },
  ICESPICE:    {
    name: 'Ice Spice', genre: 'Hip-Hop / Drill', origin: 'New York, USA', spotters: 2900,
    bio: 'The face of Bronx drill. Undeniable energy, unstoppable momentum.',
  },
  PESOPLUMA:   {
    name: 'Peso Pluma', genre: 'Regional Mexican', origin: 'Guadalajara, Mexico', spotters: 5200,
    bio: 'Redefining regional Mexican music for a generation.',
  },
  NEWJEANS:    {
    name: 'NewJeans', genre: 'K-Pop', origin: 'Seoul, South Korea', spotters: 6800,
    bio: 'Casual cool. Effortless pop. A new aesthetic standard.',
  },
  SHUBH:       {
    name: 'Shubh', genre: 'Punjabi Pop', origin: 'Ludhiana, India', spotters: 980,
    bio: 'Melodic verse meets Punjabi soul. Rising fast.',
  },
}

export function getCreator(ticker: string): (CreatorData & { ticker: string }) | null {
  const data = CREATORS[ticker.toUpperCase()]
  if (!data) return null
  return { ...data, ticker: ticker.toUpperCase() }
}
