import { createClient } from '@/lib/supabase-server'

export interface SearchResult {
  bands: Array<{
    id: string
    name: string
    slug: string
    bio: string | null
    image_url: string | null
  }>
  tracks: Array<{
    id: string
    title: string
    file_url: string
    duration: number | null
    track_number: number
    album_id: string | null
    album_title: string
    album_cover: string | null
    band_name: string
    band_slug: string
  }>
  albums: Array<{
    id: string
    title: string
    cover_image_url: string | null
    band_name: string
    band_slug: string
  }>
}

export async function searchDistro(query: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { bands: [], tracks: [], albums: [] }
  }

  const supabase = await createClient()
  const searchTerm = `%${query.trim()}%`

  // Parallel queries for better performance
  const [bandsResult, tracksResult, albumsResult] = await Promise.all([
    // Search bands
    supabase
      .from('bands')
      .select('id, name, slug, bio, image_url')
      .ilike('name', searchTerm)
      .limit(5),

    // Search tracks with album and band info
    supabase
      .from('tracks')
      .select(`
        id,
        title,
        file_url,
        duration,
        track_number,
        album_id,
        albums (
          id,
          title,
          cover_image_url,
          bands (
            name,
            slug
          )
        )
      `)
      .ilike('title', searchTerm)
      .limit(10),

    // Search albums with band info
    supabase
      .from('albums')
      .select(`
        id,
        title,
        cover_image_url,
        bands!inner (
          name,
          slug
        )
      `)
      .ilike('title', searchTerm)
      .limit(10)
  ])

  // Process tracks result - flatten the nested structure
  const tracks = tracksResult.data?.map(track => {
    // Extract album data - albums might be an array or single object from Supabase
    const album = Array.isArray(track.albums) 
      ? track.albums[0] 
      : track.albums

    // Extract band data - bands is nested inside album
    const band = Array.isArray(album?.bands)
      ? album.bands[0]
      : album?.bands

    return {
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      track_number: track.track_number,
      album_id: track.album_id || album?.id || null,
      album_title: album?.title || '',
      album_cover: album?.cover_image_url || null,
      band_name: band?.name || '',
      band_slug: band?.slug || '',
    }
  }) || []

  // Process albums result - flatten the nested structure
  const albums = albumsResult.data?.map(album => {
    // Extract band data - bands might be an array or single object from Supabase
    const band = Array.isArray(album.bands)
      ? album.bands[0]
      : album.bands

    return {
      id: album.id,
      title: album.title,
      cover_image_url: album.cover_image_url,
      band_name: band?.name || '',
      band_slug: band?.slug || '',
    }
  }) || []

  return {
    bands: bandsResult.data || [],
    tracks,
    albums,
  }
}
