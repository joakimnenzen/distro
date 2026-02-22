export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bands: {
        Row: {
          id: string
          name: string
          bio: string | null
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          bio?: string | null
          slug: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          slug?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          title: string
          album_type: string
          release_date: string | null
          cover_image_url: string | null
          band_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          album_type?: string
          release_date?: string | null
          cover_image_url?: string | null
          band_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          album_type?: string
          release_date?: string | null
          cover_image_url?: string | null
          band_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          title: string
          file_url: string
          duration: number | null
          track_number: number
          album_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          file_url: string
          duration?: number | null
          track_number: number
          album_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          file_url?: string
          duration?: number | null
          track_number?: number
          album_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
