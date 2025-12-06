import { createClient } from '@/lib/supabase-server'
import { Music } from 'lucide-react'
import { AlbumCard } from '@/components/album-card'

// FIX: 'bands' is likely a single object, but let's allow it to be either just in case
interface AlbumWithBand {
  id: string
  title: string
  cover_image_url: string | null
  created_at: string
  bands: {
    name: string
  } | { name: string }[] // Allow both Object or Array
}

async function getAllAlbums(): Promise<AlbumWithBand[]> {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      cover_image_url,
      created_at,
      bands (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }

  return albums as unknown as AlbumWithBand[]
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
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  )
}
