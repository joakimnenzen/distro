import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
// Import the new Client Component
import { TrackList } from '@/components/track-list'
import { AlbumWithTracks } from '@/types/album'

async function getAlbumWithTracks(albumId: string): Promise<AlbumWithTracks | null> {
  const supabase = await createClient()

  const { data: album, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      release_date,
      cover_image_url,
      bands!inner (
        name,
        slug
      ),
      tracks (
        id,
        title,
        file_url,
        duration,
        track_number
      )
    `)
    .eq('id', albumId)
    .single()

  if (error || !album) {
    return null
  }

  return album as unknown as AlbumWithTracks
}

interface AlbumPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  // In Next.js 15, params is a Promise, so we await it
  const { id } = await params
  const album = await getAlbumWithTracks(id)

  if (!album) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64 rounded-lg overflow-hidden bg-muted">
              {album.cover_image_url ? (
                <Image
                  src={album.cover_image_url}
                  alt={`${album.title} cover`}
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Cover
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-bold">{album.title}</h1>
              <Link
                href={`/band/${album.bands.slug}`}
                className="text-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                {album.bands.name}
              </Link>
            </div>

            {album.release_date && (
              <div>
                <span className="text-sm text-muted-foreground">
                  Released {new Date(album.release_date).getFullYear()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{album.tracks.length} tracks</span>
            </div>
          </div>
        </div>

        {/* Track List - Now a Client Component */}
        <TrackList album={album} />
      </div>
    </div>
  )
}
