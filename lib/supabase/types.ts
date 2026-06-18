export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          full_name: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          cover_color: string
          discovery_score: number
          creators_spotted: number
          breakouts_identified: number
          avg_lead_days: number
          momentum_accuracy: number
          discovery_rank: string
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_color?: string
          discovery_score?: number
          creators_spotted?: number
          breakouts_identified?: number
          avg_lead_days?: number
          momentum_accuracy?: number
          discovery_rank?: string
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          username?: string | null
          full_name?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_color?: string
          discovery_score?: number
          creators_spotted?: number
          breakouts_identified?: number
          avg_lead_days?: number
          momentum_accuracy?: number
          discovery_rank?: string
          onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          name: string
          slug: string
          category: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          category?: string
          description?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          genre_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          genre_id: string
          created_at?: string
        }
        Update: {
          genre_id?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          id: string
          name: string
          ticker: string
          slug: string
          category: string
          image_url: string | null
          bio: string | null
          momentum_score: number
          created_at: string
          spotify_artist_id: string | null
          spotify_followers: number | null
          spotify_popularity: number | null
          spotify_image_url: string | null
          spotify_url: string | null
          spotify_latest_release_date: string | null
          spotify_last_synced_at: string | null
        }
        Insert: {
          id?: string
          name: string
          ticker: string
          slug: string
          category?: string
          image_url?: string | null
          bio?: string | null
          momentum_score?: number
          created_at?: string
          spotify_artist_id?: string | null
          spotify_followers?: number | null
          spotify_popularity?: number | null
          spotify_image_url?: string | null
          spotify_url?: string | null
          spotify_latest_release_date?: string | null
          spotify_last_synced_at?: string | null
        }
        Update: {
          name?: string
          ticker?: string
          slug?: string
          category?: string
          image_url?: string | null
          bio?: string | null
          momentum_score?: number
          spotify_artist_id?: string | null
          spotify_followers?: number | null
          spotify_popularity?: number | null
          spotify_image_url?: string | null
          spotify_url?: string | null
          spotify_latest_release_date?: string | null
          spotify_last_synced_at?: string | null
        }
        Relationships: []
      }
      creator_genres: {
        Row: {
          creator_id: string
          genre_id: string
        }
        Insert: {
          creator_id: string
          genre_id: string
        }
        Update: {
          creator_id?: string
          genre_id?: string
        }
        Relationships: []
      }
      spots: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          notes: string | null
          spotted_at: string
          spot_status: string
          archived_at: string | null
          spot_duration_days: number | null
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          notes?: string | null
          spotted_at?: string
          spot_status?: string
          archived_at?: string | null
          spot_duration_days?: number | null
        }
        Update: {
          notes?: string | null
          spot_status?: string
          archived_at?: string | null
          spot_duration_days?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          creator_id: string | null
          followee_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          creator_id?: string | null
          followee_id?: string | null
          created_at?: string
        }
        Update: {
          creator_id?: string | null
          followee_id?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          creator_id: string | null
          target_user_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          creator_id?: string | null
          target_user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          metadata?: Json
        }
        Relationships: []
      }
      creator_views: {
        Row: {
          id: string
          user_id: string
          ticker: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          viewed_at?: string
        }
        Update: {
          ticker?: string
        }
        Relationships: []
      }
      creator_searches: {
        Row: {
          id: string
          user_id: string | null
          query: string
          result_ticker: string | null
          searched_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          result_ticker?: string | null
          searched_at?: string
        }
        Update: {
          query?: string
          result_ticker?: string | null
        }
        Relationships: []
      }
      editorial_boosts: {
        Row: {
          id: string
          ticker: string
          boost_score: number
          reason: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticker: string
          boost_score?: number
          reason?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          boost_score?: number
          reason?: string | null
          active?: boolean
        }
        Relationships: []
      }
      creator_recommendations: {
        Row: {
          id: string
          user_id: string
          ticker: string
          section_id: string | null
          reason_type: string | null
          score: number | null
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          section_id?: string | null
          reason_type?: string | null
          score?: number | null
          generated_at?: string
        }
        Update: {
          section_id?: string | null
          reason_type?: string | null
          score?: number | null
        }
        Relationships: []
      }
      recommendation_feedback: {
        Row: {
          id: string
          user_id: string
          ticker: string
          feedback_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          feedback_type: string
          created_at?: string
        }
        Update: {
          feedback_type?: string
        }
        Relationships: []
      }
      discovery_cards: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          spotter_rank: number
          momentum_at_spot: number
          momentum_tier: string
          spotted_at: string
          moved_on_at: string | null
          spot_duration_days: number | null
          first_spotted_at: string | null
          first_moved_on_at: string | null
          latest_respotted_at: string | null
          spot_status: string
          rediscovery_count: number
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          spotter_rank: number
          momentum_at_spot?: number
          momentum_tier?: string
          spotted_at?: string
          moved_on_at?: string | null
          spot_duration_days?: number | null
          first_spotted_at?: string | null
          first_moved_on_at?: string | null
          latest_respotted_at?: string | null
          spot_status?: string
          rediscovery_count?: number
        }
        Update: {
          moved_on_at?: string | null
          spot_duration_days?: number | null
          first_spotted_at?: string | null
          first_moved_on_at?: string | null
          latest_respotted_at?: string | null
          spot_status?: string
          rediscovery_count?: number
        }
        Relationships: []
      }
      spot_chapters: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          chapter_number: number
          started_at: string
          ended_at: string | null
          duration_days: number | null
          event_type: string
          spotter_rank: number | null
          momentum_at_spot: number
          momentum_tier: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          chapter_number?: number
          started_at?: string
          ended_at?: string | null
          duration_days?: number | null
          event_type?: string
          spotter_rank?: number | null
          momentum_at_spot?: number
          momentum_tier?: string
        }
        Update: {
          ended_at?: string | null
          duration_days?: number | null
        }
        Relationships: []
      }
      artist_spot_counters: {
        Row: {
          id: string
          creator_id: string
          next_spotter_number: number
          total_spotter_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          next_spotter_number?: number
          total_spotter_count?: number
          updated_at?: string
        }
        Update: {
          next_spotter_number?: number
          total_spotter_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      share_cards: {
        Row: {
          id: string
          share_slug: string
          user_id: string | null
          creator_id: string | null
          share_type: string
          title: string | null
          subtitle: string | null
          caption: string | null
          metadata: Json
          created_at: string
          view_count: number
          last_viewed_at: string | null
        }
        Insert: {
          id?: string
          share_slug?: string
          user_id?: string | null
          creator_id?: string | null
          share_type: string
          title?: string | null
          subtitle?: string | null
          caption?: string | null
          metadata?: Json
          created_at?: string
          view_count?: number
          last_viewed_at?: string | null
        }
        Update: {
          view_count?: number
          last_viewed_at?: string | null
        }
        Relationships: []
      }
      share_events: {
        Row: {
          id: string
          share_card_id: string | null
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          share_card_id?: string | null
          event_type: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      user_artist_spots: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          spotter_number: number
          first_spotted_at: string
          first_moved_on_at: string | null
          latest_spotted_at: string
          latest_moved_on_at: string | null
          is_currently_spotted: boolean
          has_ever_moved_on: boolean
          has_rediscovered: boolean
          rediscovered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          spotter_number: number
          first_spotted_at?: string
          first_moved_on_at?: string | null
          latest_spotted_at?: string
          latest_moved_on_at?: string | null
          is_currently_spotted?: boolean
          has_ever_moved_on?: boolean
          has_rediscovered?: boolean
          rediscovered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_moved_on_at?: string | null
          latest_spotted_at?: string
          latest_moved_on_at?: string | null
          is_currently_spotted?: boolean
          has_ever_moved_on?: boolean
          has_rediscovered?: boolean
          rediscovered_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_share_view: {
        Args: { p_slug: string }
        Returns: void
      }
      spot_or_rediscover: {
        Args: { p_user_id: string; p_creator_id: string }
        Returns: { spotter_number: number; card_status: string }
      }
      move_on_creator: {
        Args: { p_user_id: string; p_creator_id: string; p_duration_days?: number }
        Returns: { spotter_number: number; card_status: string }
      }
      assign_spotter_number: {
        Args: { p_creator_id: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

export type SupabaseProfile = Database['public']['Tables']['profiles']['Row']
export type SupabaseGenre = Database['public']['Tables']['genres']['Row']
export type SupabaseCreator = Database['public']['Tables']['creators']['Row']
export type SupabaseSpot = Database['public']['Tables']['spots']['Row']
export type SupabaseFollow = Database['public']['Tables']['follows']['Row']
export type SupabaseActivity = Database['public']['Tables']['user_activity']['Row']
export type SupabaseUserPreference = Database['public']['Tables']['user_preferences']['Row']
export type SupabaseUserArtistSpot = Database['public']['Tables']['user_artist_spots']['Row']
export type SupabaseArtistSpotCounter = Database['public']['Tables']['artist_spot_counters']['Row']
