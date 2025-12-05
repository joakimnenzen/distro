export interface AlbumWithTracks {
  id: string
  title: string
  release_date: string | null
  cover_image_url: string | null
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
  }>
}
