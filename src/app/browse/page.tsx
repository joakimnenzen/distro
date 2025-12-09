import { createClient } from '@/lib/supabase-server'
import { Music } from 'lucide-react'
import { AlbumCard } from '@/components/album-card'

interface AlbumWithBand {
  id: string
  title: string
  cover_image_url: string | null
  created_at: string
  bands: {
    name: string
    slug: string
  }[]
}

async function getAllAlbums(): Promise<AlbumWithBand[]> {
  const supabase = await createClient()

  // First get albums with band_id
  const { data: albums, error } = await supabase
    .from('albums')
    .select('id, title, cover_image_url, created_at, band_id')
    .order('created_at', { ascending: false })

  if (error || !albums) {
    console.error('Error fetching albums:', error)
    return []
  }

  // Then get bands for these albums
  const bandIds = albums.map(album => album.band_id).filter(Boolean)
  if (bandIds.length === 0) {
    return albums.map(album => ({ ...album, bands: [] }))
  }

  const { data: bands, error: bandsError } = await supabase
    .from('bands')
    .select('id, name, slug')
    .in('id', bandIds)

  if (bandsError) {
    console.error('Error fetching bands:', bandsError)
    return albums.map(album => ({ ...album, bands: [] }))
  }

  // Combine albums with their bands
  const albumsWithBands = albums.map(album => ({
    ...album,
    bands: bands?.filter(band => band.id === album.band_id) || []
  }))

  return albumsWithBands as AlbumWithBand[]
}

export default async function BrowsePage() {
  const albums = await getAllAlbums()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-white mb-2">
          Fresh Pressings
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Discover the latest music from our community
        </p>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Music className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-sans font-medium text-white mb-2">
            No music yet
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-md">
            Albums will appear here once artists start uploading their music.
            Check back soon for fresh pressings!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album) => (
            <AlbumCard
            key={album.id}
            album={{
              id: album.id,
              title: album.title,
              cover_image_url: album.cover_image_url,
              bands: album.bands // Pass the array - AlbumCard will normalize it
            }}
            showBandName={true}
          />
          ))}
        </div>
      )}
    </div>
  )
}
