import { createClient } from '@/lib/supabase-server'
import { getSavedAlbums } from '@/actions/album-saves'
import { redirect } from 'next/navigation'
import { AlbumCard } from '@/components/album-card'
import { Heart } from 'lucide-react'

export default async function SavedAlbumsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const savedAlbums = await getSavedAlbums(user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-2">
          <Heart className="w-8 h-8 text-[#ff565f] fill-current" />
          <div>
            <h1 className="text-3xl font-semibold font-sans text-white mb-1">
              Saved Albums
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {savedAlbums.length} album{savedAlbums.length !== 1 ? 's' : ''} &bull; Your personal collection
            </p>
          </div>
        </div>
      </div>

      {savedAlbums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-sans font-medium text-white mb-2">
            No saved albums yet
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-md">
            Start exploring music and save the albums you love. They&apos;ll appear here for easy access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {savedAlbums.map((album) => (
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
