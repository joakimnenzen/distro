import { createClient } from '@/lib/supabase-server'
import { getSavedAlbums } from '@/actions/album-saves'
import { AlbumCard } from '@/components/album-card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

async function getLatestAlbums() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('albums')
    .select(`
      id,
      slug,
      title,
      cover_image_url,
      created_at,
      bands (
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching latest albums:', error)
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
    bands?: any
    band_name?: string
    band_slug?: string
  }>
}) {
  return (
    <Carousel
      opts={{ align: 'start', containScroll: 'trimSnaps' }}
      className="relative"
    >
      <CarouselContent className="px-2 md:px-10">
        {albums.map((album) => (
          <CarouselItem
            key={album.id}
            className="basis-[45%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
          >
            <AlbumCard album={album} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="hidden md:inline-flex left-2 bg-black/70 border-white/15 text-white hover:bg-black/90" />
      <CarouselNext className="hidden md:inline-flex right-2 bg-black/70 border-white/15 text-white hover:bg-black/90" />
    </Carousel>
  )
}

export default async function Home() {
  const supabase = await createClient()
  const [{ data: { user } }, latestAlbums] = await Promise.all([
    supabase.auth.getUser(),
    getLatestAlbums(),
  ])
  const savedAlbums = user ? await getSavedAlbums(user.id) : []

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Latest Albums */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-sans font-semibold text-white">
            Latest Albums
          </h2>
        </div>

        {latestAlbums.length === 0 ? (
          <p className="text-sm text-white/60 font-mono">
            No albums yet.
          </p>
        ) : (
          <AlbumCarousel albums={latestAlbums as any} />
        )}
      </section>

      {/* Saved Albums */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-sans font-semibold text-white">
            Saved Albums
          </h2>
        </div>

        {!user ? (
          <p className="text-sm text-white/60 font-mono">
            Log in to see your saved albums.
          </p>
        ) : savedAlbums.length === 0 ? (
          <p className="text-sm text-white/60 font-mono">
            You haven’t saved any albums yet.
          </p>
        ) : (
          <AlbumCarousel albums={savedAlbums as any} />
        )}
      </section>
    </div>
  )
}
