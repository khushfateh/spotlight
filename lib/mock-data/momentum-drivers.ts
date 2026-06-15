export type DriverCategory = 'growth' | 'community' | 'catalysts' | 'discussion' | 'events'

export type MomentumDriver = {
  label: string
  category: DriverCategory
  value?: string
  delta?: string
  isPositive?: boolean
}

export const momentumDrivers: Record<string, MomentumDriver[]> = {
  APDHILLON: [
    { label: 'Spotify monthly listeners', category: 'growth', value: '10.2M', delta: '+18%', isPositive: true },
    { label: 'Community Spots', category: 'community', delta: '+42 this week', isPositive: true },
    { label: 'North American tour announced', category: 'catalysts', isPositive: true },
    { label: 'Coachella headliner confirmed', category: 'events', isPositive: true },
    { label: 'Search trend spike', category: 'discussion', delta: '+67% this week', isPositive: true },
    { label: 'Mentioned by Drake on Twitter', category: 'discussion', isPositive: true },
  ],
  MRBEAST: [
    { label: 'YouTube subscribers', category: 'growth', value: '354M', delta: '+2M this week', isPositive: true },
    { label: 'Netflix deal announced', category: 'catalysts', isPositive: true },
    { label: 'Feastables × Target launch', category: 'events', isPositive: true },
    { label: 'Video views this month', category: 'growth', value: '800M', isPositive: true },
    { label: 'Community engagement', category: 'community', delta: 'Up 28%', isPositive: true },
  ],
  KAICENAT: [
    { label: 'Twitch subscribers (record)', category: 'growth', value: '9.2M', delta: '+890K this week', isPositive: true },
    { label: 'AMP collab views', category: 'community', value: '47M', isPositive: true },
    { label: 'Most-subbed streamer 8 months running', category: 'events', isPositive: true },
    { label: 'New merch drop sold out', category: 'discussion', delta: '12 min', isPositive: true },
    { label: 'Brand deal with Nike confirmed', category: 'catalysts', isPositive: true },
  ],
  SPEED: [
    { label: 'Viral in 18 countries simultaneously', category: 'discussion', isPositive: true },
    { label: 'Ronaldo collab', category: 'events', value: '80M views', isPositive: true },
    { label: 'World tour announced', category: 'catalysts', isPositive: true },
    { label: 'FIFA partnership', category: 'catalysts', isPositive: true },
    { label: 'TikTok trend driven by content', category: 'community', delta: '+2.4M reposts', isPositive: true },
  ],
  POKIMANE: [
    { label: 'Myna Snacks × Walmart', category: 'catalysts', isPositive: true },
    { label: 'Twitch charity record viewership', category: 'events', isPositive: true },
    { label: 'New podcast launched', category: 'growth', isPositive: true },
    { label: 'Coachella appearance', category: 'events', isPositive: true },
    { label: 'Twitch followers', category: 'growth', value: '10.5M', delta: '+120K', isPositive: true },
  ],
  LILNASX: [
    { label: 'New album announcement', category: 'catalysts', isPositive: true },
    { label: 'Versace collaboration', category: 'events', isPositive: true },
    { label: 'Streams this month', category: 'growth', value: '680M', delta: '+24%', isPositive: true },
    { label: 'World tour 22 cities confirmed', category: 'catalysts', isPositive: true },
    { label: 'Cultural conversation spike', category: 'discussion', delta: '+89% on Twitter', isPositive: true },
  ],
  CHARLI: [
    { label: 'First TikToker to 150M followers', category: 'growth', isPositive: true },
    { label: 'World dance tour announced', category: 'catalysts', isPositive: true },
    { label: "D'Amelio Show Season 3", category: 'events', isPositive: true },
    { label: 'Brand deals Q2', category: 'growth', value: '$8M', isPositive: true },
    { label: 'Community engagement', category: 'community', delta: 'Up 15%', isPositive: true },
  ],
  SHUBH: [
    { label: 'Spotify listeners', category: 'growth', value: '3.8M', delta: '+22% this month', isPositive: true },
    { label: 'UK tour sold out', category: 'catalysts', isPositive: true },
    { label: 'Trending in 6 countries', category: 'discussion', isPositive: true },
    { label: 'Community Spots', category: 'community', delta: '+29 this week', isPositive: true },
    { label: 'Collab with AP Dhillon rumored', category: 'discussion', isPositive: true },
  ],
  KARANAUJLA: [
    { label: 'Punjabi rap streams', category: 'growth', value: '1.2B lifetime', isPositive: true },
    { label: 'Canada arena tour selling fast', category: 'catalysts', isPositive: true },
    { label: 'Collab with Drake camp', category: 'discussion', isPositive: true },
    { label: 'New album "IYKYK"', category: 'catalysts', delta: '21 days', isPositive: true },
    { label: 'Cross-genre recognition growing', category: 'community', isPositive: true },
  ],
  HANUMANKIND: [
    { label: 'Viral rap clip', category: 'discussion', delta: '18M plays in 72h', isPositive: true },
    { label: 'Soundcloud → mainstream pipeline active', category: 'growth', isPositive: true },
    { label: 'Featured on Rolling Stone India', category: 'events', isPositive: true },
    { label: 'Community Spots', category: 'community', delta: '+14 this week', isPositive: true },
    { label: 'SXSW 2026 appearance confirmed', category: 'catalysts', isPositive: true },
  ],
  DOJACAT: [
    { label: 'Grammy nominations', category: 'events', value: '3 categories', isPositive: true },
    { label: 'Spotify monthly listeners', category: 'growth', value: '62M', isPositive: true },
    { label: 'New era rollout started', category: 'catalysts', isPositive: true },
    { label: 'Social media comeback', category: 'discussion', delta: '12M engagements', isPositive: true },
    { label: 'Coachella performance', category: 'events', isPositive: true },
  ],
  ICESPICE: [
    { label: 'Spotify streams this week', category: 'growth', value: '140M', delta: '+18%', isPositive: true },
    { label: 'Taylor Swift feature confirmed', category: 'catalysts', isPositive: true },
    { label: 'NY cultural moment', category: 'discussion', delta: 'Trending 4 days', isPositive: true },
    { label: 'MTV VMAs performance', category: 'events', isPositive: true },
    { label: 'Community Spots', category: 'community', delta: '+38 this week', isPositive: true },
  ],
  SABRINA: [
    { label: 'Spotify monthly listeners', category: 'growth', value: '71M', delta: '+8M this month', isPositive: true },
    { label: 'Short n\' Sweet tours announced', category: 'catalysts', isPositive: true },
    { label: 'Cultural omnipresence', category: 'discussion', isPositive: true },
    { label: 'Vogue cover feature', category: 'events', isPositive: true },
    { label: 'Fan community growth', category: 'community', delta: '+2.1M followers', isPositive: true },
  ],
  TYLERTC: [
    { label: 'Grammy for Best Rap Album', category: 'events', isPositive: true },
    { label: 'Golf Wang expansion', category: 'catalysts', isPositive: true },
    { label: 'Chromakopia tour', category: 'catalysts', delta: 'Sold out in 8 min', isPositive: true },
    { label: 'Spotify monthly listeners', category: 'growth', value: '29M', isPositive: true },
    { label: 'Cultural critical acclaim', category: 'discussion', delta: 'Metacritic 97', isPositive: true },
  ],
  XQC: [
    { label: 'Most watched Twitch channel 2025', category: 'events', isPositive: true },
    { label: 'Streaming hours this month', category: 'growth', value: '280h', isPositive: true },
    { label: 'New YouTube series', category: 'catalysts', isPositive: true },
    { label: 'Gaming tournament hosting', category: 'events', isPositive: true },
    { label: 'Subscriber milestone', category: 'community', value: '12.4M Twitch', isPositive: true },
  ],
  PESOPLUMA: [
    { label: 'Billboard Hot 100 peak', category: 'events', value: '#1', isPositive: true },
    { label: 'Spotify streams', category: 'growth', value: '1.8B this year', delta: '+340%', isPositive: true },
    { label: 'Grammy nomination', category: 'events', isPositive: true },
    { label: 'Coachella headliner', category: 'events', isPositive: true },
    { label: 'Cross-genre fanbase', category: 'community', delta: 'Fastest growing', isPositive: true },
  ],
  NEWJEANS: [
    { label: 'Spotify monthly listeners', category: 'growth', value: '28M', delta: '+11M this quarter', isPositive: true },
    { label: 'Japan debut sold out in 2 min', category: 'events', isPositive: true },
    { label: 'Levi\'s × NewJeans collaboration', category: 'catalysts', isPositive: true },
    { label: 'K-pop global crossover leader', category: 'discussion', isPositive: true },
    { label: 'Community Spots', category: 'community', delta: '+67 this week', isPositive: true },
  ],
  SIDEMEN: [
    { label: 'Sunday League record viewership', category: 'events', value: '9M concurrent', isPositive: true },
    { label: 'SDMN Clothing relaunch', category: 'catalysts', isPositive: true },
    { label: 'Charity match raised £2.1M', category: 'events', isPositive: true },
    { label: 'YouTube subscribers', category: 'growth', value: '28M', isPositive: true },
  ],
  VALKYRAE: [
    { label: 'YouTube Gaming Creator of the Year', category: 'events', isPositive: true },
    { label: '100 Thieves esports new league', category: 'catalysts', isPositive: true },
    { label: 'New gaming series launched', category: 'growth', isPositive: true },
    { label: 'Twitch partnership renewed', category: 'catalysts', isPositive: true },
  ],
  CORPSE: [
    { label: 'New single 5M plays in 24h', category: 'growth', isPositive: true },
    { label: 'Mystery persona engagement spike', category: 'community', delta: '+890K new followers', isPositive: true },
    { label: 'Collab with Glass Animals rumored', category: 'discussion', isPositive: true },
  ],
  PDPIE: [
    { label: 'Gaming comeback video', category: 'growth', value: '20M views', isPositive: true },
    { label: 'Minecraft revival series', category: 'catalysts', isPositive: true },
    { label: 'Japan content driving new audience', category: 'community', isPositive: true },
  ],
  DRDIS: [
    { label: 'Slimezone game studio alpha', category: 'catalysts', value: '500K wishlists', isPositive: true },
    { label: 'Champions Club membership', category: 'community', delta: '+30%', isPositive: true },
    { label: 'Studio partner announcement', category: 'events', isPositive: true },
  ],
}

export function getMomentumDrivers(ticker: string): MomentumDriver[] {
  return momentumDrivers[ticker.toUpperCase()] ?? []
}

export const driverCategoryLabel: Record<DriverCategory, string> = {
  growth: 'Growth',
  community: 'Community',
  catalysts: 'Catalysts',
  discussion: 'Discussion',
  events: 'Events',
}
