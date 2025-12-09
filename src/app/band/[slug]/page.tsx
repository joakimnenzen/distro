import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlbumCard } from '@/components/album-card'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getBand(slug: string, userId: string) {
  const supabase = await createClient()

  const { data: band, error } = await supabase
    .from('bands')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', userId)
    .single()

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

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BandPage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { slug } = await params
  const band = await getBand(slug, user.id)

  if (!band) {
    notFound()
  }

  const albums = await getBandAlbums(band.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{band.name}</h1>
            <p className="text-muted-foreground">{band.bio || 'No description'}</p>
          </div>
          <Button asChild>
            <Link href={`/band/${band.slug}/upload`}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Album
            </Link>
          </Button>
        </div>

        {/* Discography Section */}
        <div className="mb-6">
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
