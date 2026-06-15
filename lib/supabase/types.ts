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
        }
        Update: {
          name?: string
          ticker?: string
          slug?: string
          category?: string
          image_url?: string | null
          bio?: string | null
          momentum_score?: number
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
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          notes?: string | null
          spotted_at?: string
        }
        Update: {
          notes?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
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
