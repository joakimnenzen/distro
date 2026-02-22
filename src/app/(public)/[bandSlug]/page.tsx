import { createClient } from '@/lib/supabase-server'
import { getLikedTrackIds } from '@/actions/likes'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlbumCard } from '@/components/album-card'
import { TrackList } from '@/components/track-list'
import { BandDonateControls } from '@/components/band-donate-controls'
import { syncBandStripeStatus } from '@/actions/sync-band-stripe-status'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

async function getBand(slug: string, userId?: string) {
  const supabase = await createClient()

  let query = supabase.from('bands').select('*').eq('slug', slug)
  if (userId) query = query.eq('owner_id', userId)

  const { data: band, error } = await query.single()
  if (error) return null
  return band
}

async function getBandAlbums(bandId: string) {
  const supabase = await createClient()

  const { data: albums, error } = await supabase
    .from('albums')
    .select(
      `
      id,
      slug,
      title,
      album_type,
      cover_image_url,
      created_at,
      release_date,
      bands (
        name,
        slug
      )
    `
    )
    .eq('band_id', bandId)
    .order('release_date', { ascending: false, nullsFirst: false })
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
    .select(
      `
      id,
      title,
      file_url,
      duration,
      track_number,
      play_count,
      album_id,
      albums!inner (
        title,
        slug,
        cover_image_url,
        band_id
      )
    `
    )
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
    bandSlug: string
  }>
  searchParams?: Promise<{
    stripe?: string
  }>
}

export default async function BandPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { bandSlug } = await params
  const sp = searchParams ? await searchParams : undefined

  let band = await getBand(bandSlug)
  if (!band) notFound()

  if (sp?.stripe === 'return' && user && band.owner_id === user.id) {
    await syncBandStripeStatus(band.id)
    band = await getBand(bandSlug)
    if (!band) notFound()
  }

  const [topTracks, albums, likedTrackIds] = await Promise.all([
    getBandTopTracks(band.id),
    getBandAlbums(band.id),
    user ? getLikedTrackIds(user.id) : Promise.resolve([]),
  ])
  const isOwner = user && band.owner_id === user.id
  const paymentsEnabled = Boolean(band.stripe_payouts_enabled && band.stripe_account_id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          <div className="relative flex flex-col h-56 md:h-72 items-start justify-end gap-4 p-6">
            <div className="min-w-0">
              <h1 className="truncate font-sans text-4xl md:text-6xl font-bold tracking-tight text-white">
                {band.name}
              </h1>
              {band.bio ? (
                <p className="mt-2 max-w-2xl text-sm md:text-base text-white/70 line-clamp-2">{band.bio}</p>
              ) : (
                <p className="mt-2 text-sm text-white/50"> </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <Button asChild className="bg-white text-black hover:bg-white/90">
                  <Link href={`/band/${band.slug}/upload`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Album
                  </Link>
                </Button>
              )}
              <BandDonateControls
                bandId={band.id}
                bandName={band.name}
                donationsEnabled={paymentsEnabled}
                isOwner={Boolean(isOwner)}
              />
            </div>
          </div>
        </div>

        {topTracks.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-sans font-semibold text-white mb-4">Most played</h2>
            <TrackList
              variant="album"
              hideHeader={true}
              hideTableHeader={true}
              showCoverImage={true}
              tracks={topTracks.map((t: any, index: number) => ({
                id: t.id,
                title: t.title,
                file_url: t.file_url,
                duration: t.duration,
                track_number: index + 1,
                play_count: t.play_count,
                album_id: t.album_id,
                album_title: t.albums?.title,
                album_slug: t.albums?.slug,
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

        <div className="mb-6 mt-10">
          <h2 className="text-2xl font-sans font-semibold text-white mb-4">Discography</h2>
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
                    bands: { name: band.name, slug: band.slug },
                  }}
                  subtitle="year"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


