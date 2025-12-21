import { createClient } from '@/lib/supabase-server'
<<<<<<< HEAD
import { notFound } from 'next/navigation'
=======
import { getLikedTrackIds } from '@/actions/likes'
import { isAlbumSaved } from '@/actions/album-saves'
<<<<<<< HEAD
import { notFound, redirect } from 'next/navigation'
>>>>>>> 31e799a (fixes)
=======
import { notFound } from 'next/navigation'
>>>>>>> 848ba80 (More by added to Album page)
import Image from 'next/image'
import Link from 'next/link'
import { TrackList } from '@/components/track-list'
import { AlbumLikeButton } from '@/components/album-like-button'
import { AlbumWithTracks } from '@/types/album'
import { AlbumCard } from '@/components/album-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

async function getAlbumWithTracks(albumId: string): Promise<AlbumWithTracks | null> {
  const supabase = await createClient()

  const { data: album, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      release_date,
      cover_image_url,
      band_id,
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

async function getMoreAlbumsByBand(bandId: string, currentAlbumId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      cover_image_url,
      created_at,
      release_date,
      bands (
        name,
        slug
      )
    `)
    .eq('band_id', bandId)
    .neq('id', currentAlbumId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching more albums by band:', error)
    return []
  }

  return data || []
}

function AlbumCarousel({
  albums,
}: {
  albums: Array<{
    id: string
    title: string
    cover_image_url: string | null
    created_at?: string
    release_date?: string | null
    bands?: any
    band_name?: string
    band_slug?: string
  }>
}) {
  return (
    <Carousel opts={{ align: 'start', containScroll: 'trimSnaps' }} className="relative">
      <CarouselContent className="px-2 md:px-10">
        {albums.map((a) => (
          <CarouselItem key={a.id} className="basis-[45%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
            <AlbumCard album={a} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="hidden md:inline-flex left-2 bg-black/70 border-white/15 text-white hover:bg-black/90" />
      <CarouselNext className="hidden md:inline-flex right-2 bg-black/70 border-white/15 text-white hover:bg-black/90" />
    </Carousel>
  )
}

interface AlbumPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
<<<<<<< HEAD
=======
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

>>>>>>> b08f707 (feat: add my albums dashboard and implement google oauth login)
  // In Next.js 15, params is a Promise, so we await it
  const { id } = await params
  const album = await getAlbumWithTracks(id)

  if (!album) {
    notFound()
  }

<<<<<<< HEAD
<<<<<<< HEAD
=======
  // Fetch user's liked track IDs
  const likedTrackIds = await getLikedTrackIds(user.id)
=======
  // Fetch user's liked track IDs (empty array if not logged in)
  const likedTrackIds = user ? await getLikedTrackIds(user.id) : []
>>>>>>> b08f707 (feat: add my albums dashboard and implement google oauth login)

  // Check if the current user has saved this album
  const isSaved = user ? await isAlbumSaved(user.id, album.id) : false

  const moreAlbums = await getMoreAlbumsByBand(album.band_id, album.id)

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
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold">{album.title}</h1>
                <Link
                  href={`/band/${album.bands.slug}`}
                  className="text-xl text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {album.bands.name}
                </Link>
              </div>
              <AlbumLikeButton 
                albumId={album.id} 
                initialIsSaved={isSaved}
                size="default"
                variant="ghost"
              />
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
<<<<<<< HEAD
>>>>>>> d590fff (refactor: make TrackList reusable and fix liked songs data fetching)
=======

        {moreAlbums.length > 0 && (
          <section className="mt-10 space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-sans font-semibold text-white">
                More by {album.bands.name}
              </h2>
            </div>
            <AlbumCarousel albums={moreAlbums as any} />
          </section>
        )}
>>>>>>> 848ba80 (More by added to Album page)
      </div>
    </div>
  )
}
