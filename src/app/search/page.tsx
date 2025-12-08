import { Suspense } from 'react'
import { searchDistro } from '@/actions/search'
import { AlbumCard } from '@/components/album-card'
import { SearchTrackRow } from '@/components/search-track-row'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Music, Search } from 'lucide-react'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

function ArtistCard({ band }: { band: { id: string; name: string; slug: string; bio: string | null } }) {
  return (
    <Link href={`/band/${band.slug}`} className="group">
      <div className="flex flex-col items-center space-y-3 p-4 rounded-lg hover:bg-white/5 transition-colors">
        <Avatar className="w-20 h-20">
          <AvatarImage src="" alt={band.name} />
          <AvatarFallback className="bg-white/10 text-white font-mono text-lg">
            {band.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h3 className="font-sans font-medium text-white text-sm group-hover:text-white/80 transition-colors">
            {band.name}
          </h3>
        </div>
      </div>
    </Link>
  )
}


async function SearchResults({ query }: { query: string }) {
  const results = await searchDistro(query)

  const hasResults = results.bands.length > 0 || results.tracks.length > 0 || results.albums.length > 0

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-sans font-medium text-white mb-2">
          No results found
        </h2>
        <p className="text-muted-foreground font-mono text-sm max-w-md">
          We couldn&apos;t find any music matching &ldquo;{query}&rdquo;. Try searching for an artist, song, or album name.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Artists Section */}
      {results.bands.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-sans text-white mb-6">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.bands.map((band) => (
              <ArtistCard key={band.id} band={band} />
            ))}
          </div>
        </section>
      )}

      {/* Songs Section */}
      {results.tracks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-sans text-white mb-6">Songs</h2>
          <div className="space-y-2">
            {results.tracks.map((track) => (
              <SearchTrackRow key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

      {/* Albums Section */}
      {results.albums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-sans text-white mb-6">Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{
                  id: album.id,
                  title: album.title,
                  cover_image_url: album.cover_image_url,
                  band_name: album.band_name,
                  band_slug: album.band_slug,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams

  if (!q?.trim()) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold font-sans text-white mb-2">
            Search for music
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-md">
            Find your favorite artists, songs, and albums from our community.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-sans text-white mb-2">
          Search results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Found results across artists, songs, and albums
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      }>
        <SearchResults query={q} />
      </Suspense>
    </div>
  )
}
