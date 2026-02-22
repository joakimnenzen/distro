import { createClient } from '@/lib/supabase-server'
import { getLikedTrackIds } from '@/actions/likes'
import { isAlbumSaved } from '@/actions/album-saves'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { TrackList } from '@/components/track-list'
import { AlbumLikeButton } from '@/components/album-like-button'
import { AlbumWithTracks } from '@/types/album'
import { AlbumCard } from '@/components/album-card'
import { BandDonateControls } from '@/components/band-donate-controls'
import { BuyAlbumDialog } from '@/components/buy-album-dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

async function getAlbumWithTracks(bandSlug: string, albumSlug: string): Promise<AlbumWithTracks | null> {
  const supabase = await createClient()

  const { data: band } = await supabase.from('bands').select('id').eq('slug', bandSlug).single()
  if (!band?.id) return null

  const { data: album, error } = await supabase
    .from('albums')
    .select(
      `
      id,
      slug,
      title,
      album_type,
      release_date,
      cover_image_url,
      band_id,
      is_purchasable,
      price_ore,
      currency,
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
    `
    )
    .eq('slug', albumSlug)
    .eq('band_id', band.id)
    .single()

  if (error || !album) return null
  return album as unknown as AlbumWithTracks
}

async function getMoreAlbumsByBand(bandId: string, currentAlbumId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('albums')
    .select(
      `
      id,
      slug,
      title,
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
    slug?: string | null
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
    bandSlug: string
    albumSlug: string
  }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { bandSlug, albumSlug } = await params
  const album = await getAlbumWithTracks(bandSlug, albumSlug)
  if (!album) notFound()

  const likedTrackIds = user ? await getLikedTrackIds(user.id) : []
  const isSaved = user ? await isAlbumSaved(user.id, album.id) : false
  const moreAlbums = await getMoreAlbumsByBand(album.band_id, album.id)

  const { data: bandRow } = await supabase
    .from('bands')
    .select('id, owner_id, stripe_account_id, stripe_payouts_enabled')
    .eq('id', album.band_id)
    .single()

  const paymentsEnabled = Boolean(bandRow?.stripe_account_id && bandRow?.stripe_payouts_enabled)
  const isBandOwner = Boolean(user && bandRow?.owner_id === user.id)
  const canBuyAlbum = Boolean(album.is_purchasable && album.price_ore && album.price_ore > 0)
  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null
  const releaseTypeLabel =
    album.album_type === 'ep'
      ? 'EP'
      : album.album_type === 'single'
        ? 'Single'
        : album.album_type === 'demo'
          ? 'Demo'
          : 'Album'

  const totalDuration = album.tracks.reduce((total, track) => total + (track.duration || 0), 0)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Cover</div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold">{album.title}</h1>
                <Link
                  href={`/${album.bands.slug}`}
                  className="text-xl text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {album.bands.name}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <AlbumLikeButton albumId={album.id} initialIsSaved={isSaved} size="default" variant="ghost" />
              </div>
            </div>

            {(releaseYear || releaseTypeLabel) && (
              <div>
                <span className="text-sm text-muted-foreground">
                  {releaseYear ? `Released ${releaseYear} • ${releaseTypeLabel}` : releaseTypeLabel}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{album.tracks.length} tracks</span>
              <span>•</span>
              <span>{formatTotalDuration(totalDuration)}</span>
            </div>

            {canBuyAlbum && (
              <BuyAlbumDialog albumId={album.id} albumTitle={album.title} priceOre={album.price_ore as number} />
            )}
          </div>
        </div>

        <TrackList
          tracks={album.tracks.map((track) => ({
            id: track.id,
            title: track.title,
            file_url: track.file_url,
            duration: track.duration,
            track_number: track.track_number,
            play_count: track.play_count,
            album_id: album.id,
            album_title: album.title,
            album_slug: album.slug,
            band_name: album.bands.name,
            band_slug: album.bands.slug,
            cover_image_url: album.cover_image_url,
          }))}
          variant="album"
          showBandNameInAlbumVariant={true}
          headerInfo={{
            id: album.id,
            title: 'Tracks',
            cover_image_url: album.cover_image_url,
            type: 'album',
          }}
          likedTrackIds={likedTrackIds}
        />

        {moreAlbums.length > 0 && (
          <section className="mt-10 space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-sans font-semibold text-white">More by {album.bands.name}</h2>
            </div>
            <AlbumCarousel albums={moreAlbums as any} />
          </section>
        )}
      </div>
    </div>
  )
}


