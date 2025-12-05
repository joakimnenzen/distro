import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      *,
      tracks (*)
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No albums yet</p>
              <p className="text-muted-foreground">Upload your first album to get started</p>
            </div>
          ) : (
            albums.map((album) => (
              <Card key={album.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{album.title}</CardTitle>
                  <CardDescription>
                    {album.release_date ? new Date(album.release_date).getFullYear() : 'No release date'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {album.tracks?.length || 0} tracks
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/album/${album.id}`}>
                      View Album
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
