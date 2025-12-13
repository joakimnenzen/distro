import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music } from 'lucide-react'
import { AlbumsTable } from '@/components/albums-table'

async function getUserAlbums(userId: string) {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      cover_image_url,
      created_at,
      band_id,
      bands!inner (
        name,
        slug,
        owner_id
      ),
      tracks (id)
    `)
    .eq('bands.owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }

  // Transform the data to include track count and flatten band data
  return albums.map(album => {
    // Handle bands - can be array or single object
    const band = Array.isArray(album.bands) ? album.bands[0] : album.bands

    return {
      id: album.id,
      title: album.title,
      cover_image_url: album.cover_image_url,
      created_at: album.created_at,
      band_id: album.band_id,
      band_name: band?.name || '',
      band_slug: band?.slug || '',
      tracksCount: album.tracks?.length || 0,
    }
  })
}

export default async function AlbumsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const albums = await getUserAlbums(user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-white mb-2">
          My Albums
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Manage all albums from your bands
        </p>
      </div>

      {albums.length === 0 ? (
        <Card className="bg-black/20 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-white mb-2">No albums yet</CardTitle>
            <p className="text-muted-foreground font-mono text-sm mb-6 max-w-md">
              Upload your first album to get started. Create a band and start adding music to your collection.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Your Albums ({albums.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AlbumsTable albums={albums} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
