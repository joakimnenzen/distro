import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
// Import the new Client Component
import { TrackList } from '@/components/track-list'
import { AlbumWithTracks } from '@/types/album'
import { formatTime } from '@/lib/utils'

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
        track_number,
        play_count
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

<<<<<<< HEAD
=======
  // Fetch user's liked track IDs
  const likedTrackIds = await getLikedTrackIds(user.id)

  // Calculate total album duration
  const totalDuration = album.tracks.reduce((total, track) => total + (track.duration || 0), 0)

  // Format total duration in a more readable way for the header
  const formatTotalDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

>>>>>>> c19dc7c (band page updates)
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
                className="text-xl text-muted-foreground hover:text-foreground hover:underline transition-colors"
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
              <span>•</span>
              <span>{formatTotalDuration(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* Track List - Now a Client Component */}
<<<<<<< HEAD
<<<<<<< HEAD
        <TrackList album={album} />
=======
        <TrackList album={album} likedTrackIds={likedTrackIds} totalDuration={totalDuration} />
>>>>>>> c19dc7c (band page updates)
=======
        <TrackList 
          tracks={album.tracks.map(track => ({
            id: track.id,
            title: track.title,
            file_url: track.file_url,
            duration: track.duration,
            track_number: track.track_number,
            play_count: track.play_count,
            album_id: album.id,
            album_title: album.title,
            band_name: album.bands.name,
            band_slug: album.bands.slug,
            cover_image_url: album.cover_image_url,
          }))}
          variant="album"
          headerInfo={{
            id: album.id,
            title: 'Tracks',
            cover_image_url: album.cover_image_url,
            type: 'album'
          }}
          likedTrackIds={likedTrackIds}
        />
>>>>>>> d590fff (refactor: make TrackList reusable and fix liked songs data fetching)
      </div>
    </div>
  )
}
