export type SpotifyToken = {
  accessToken: string
  expiresAt: number
}

export type SpotifyImage = {
  url: string
  height: number
  width: number
}

export type SpotifyArtist = {
  id: string
  name: string
  genres: string[]
  followers: { total: number }
  popularity: number
  images: SpotifyImage[]
  external_urls: { spotify: string }
}

export type SpotifyTrack = {
  id: string
  name: string
  popularity: number
  preview_url: string | null
  external_urls: { spotify: string }
  album: {
    id: string
    name: string
    images: SpotifyImage[]
    release_date: string
  }
}

export type SpotifyAlbum = {
  id: string
  name: string
  album_type: 'album' | 'single' | 'compilation'
  release_date: string
  total_tracks: number
  images: SpotifyImage[]
  external_urls: { spotify: string }
}

export type SpotifySearchResult = {
  artists: {
    items: SpotifyArtist[]
    total: number
  }
}

// Note: Spotify Client Credentials flow returns a limited artist object.
// followers, genres, popularity, and top-tracks are NOT available without user auth.
export type SpotifyCreatorSnapshot = {
  artistId: string
  name: string
  imageUrl: string | null
  spotifyUrl: string
  recentReleases: {
    id: string
    name: string
    type: string
    releaseDate: string
    totalTracks: number
    imageUrl: string | null
    spotifyUrl: string
  }[]
}
