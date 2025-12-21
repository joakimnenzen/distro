export interface AlbumWithTracks {
  id: string
  title: string
  release_date: string | null
  cover_image_url: string | null
  band_id: string
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
