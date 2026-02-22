export interface AlbumWithTracks {
  id: string
  slug?: string | null
  title: string
  album_type?: 'album' | 'ep' | 'single' | 'demo' | null
  release_date: string | null
  cover_image_url: string | null
  band_id: string
  is_purchasable?: boolean
  price_ore?: number | null
  currency?: string | null
  bands: {
    name: string
    slug: string
  }
  tracks: Array<{
    id: string
    title: string
    file_url: string
    duration: number | null
    track_number: number
    play_count: number | null
  }>
}
