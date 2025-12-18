import { createClient } from '@/lib/supabase-server'
import { getLikedTrackIds } from '@/actions/likes'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlbumCard } from '@/components/album-card'
import { TrackList } from '@/components/track-list'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

async function getBand(slug: string, userId?: string) {
  const supabase = await createClient()

  // If userId is provided, check if user owns the band (for upload button)
  // Otherwise, just get the band for public viewing
  let query = supabase
    .from('bands')
    .select('*')
    .eq('slug', slug)

  if (userId) {
    query = query.eq('owner_id', userId)
  }

  const { data: band, error } = await query.single()

  if (error) {
    return null
  }

  return band
}

async function getBandAlbums(bandId: string) {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }

  return albums
}

async function getBandTopTracks(bandId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id,
      title,
      file_url,
      duration,
      track_number,
      play_count,
      album_id,
      albums!inner (
        title,
        cover_image_url,
        band_id
      )
    `)
    .eq('albums.band_id', bandId)
    .order('play_count', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching top tracks:', error)
    return []
  }

  return data || []
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BandPage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { slug } = await params
  // Get band for public viewing (no ownership check)
  const band = await getBand(slug)

  if (!band) {
    notFound()
  }

  const topTracks = await getBandTopTracks(band.id)
  const albums = await getBandAlbums(band.id)
  const isOwner = user && band.owner_id === user.id
  const likedTrackIds = user ? await getLikedTrackIds(user.id) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Band Hero (Spotify-style) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-muted/30">
          {band.image_url ? (
            <Image
              src={band.image_url}
              alt={`${band.name} banner`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          ) : null}

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          <div className="relative flex h-56 md:h-72 items-end justify-between gap-4 p-6">
            <div className="min-w-0">
              <h1 className="truncate font-sans text-4xl md:text-6xl font-bold tracking-tight text-white">
                {band.name}
              </h1>
              {band.bio ? (
                <p className="mt-2 max-w-2xl text-sm md:text-base text-white/70 line-clamp-2">
                  {band.bio}
                </p>
              ) : (
                <p className="mt-2 text-sm text-white/50"> </p>
              )}
            </div>

            {isOwner && (
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <Link href={`/band/${band.slug}/upload`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Album
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Most played tracks */}
        {topTracks.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-sans font-semibold text-white mb-4">
              Most played
            </h2>
            <TrackList
              variant="album"
              hideHeader={true}
              tracks={topTracks.map((t: any, index: number) => ({
                id: t.id,
                title: t.title,
                file_url: t.file_url,
                duration: t.duration,
                track_number: index + 1,
                play_count: t.play_count,
                album_id: t.album_id,
                album_title: t.albums?.title,
                cover_image_url: t.albums?.cover_image_url,
                band_name: band.name,
                band_slug: band.slug,
              }))}
              likedTrackIds={likedTrackIds}
              headerInfo={{
                id: band.id,
                title: 'Most played',
                cover_image_url: band.image_url,
                type: 'playlist',
              }}
            />
          </div>
        )}

        {/* Discography Section */}
        <div className="mb-6 mt-10">
          <h2 className="text-2xl font-sans font-semibold text-white mb-4">
            Discography
          </h2>
          {albums.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No albums yet</p>
              <p className="text-muted-foreground">Upload your first album to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={{
                    ...album,
                    bands: { name: band.name, slug: band.slug } // Manually attach band info since we are ON the band page
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
