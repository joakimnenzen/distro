import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateBandDialog } from '@/components/create-band-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Music, Users } from 'lucide-react'

async function getUserBands(userId: string) {
  const supabase = await createClient()

  const { data: bands, error } = await supabase
    .from('bands')
    .select(`
      *,
      albums (
        id,
        tracks (id)
      )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bands:', error)
    return []
  }

  return bands.map(band => ({
    ...band,
    albumsCount: band.albums?.length || 0,
    tracksCount: band.albums?.reduce((total: number, album: any) => total + (album.tracks?.length || 0), 0) || 0,
  }))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const bands = await getUserBands(user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your bands and music</p>
          </div>
          <CreateBandDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bands.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No bands yet</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first band to start uploading and managing your music
                </p>
                <CreateBandDialog />
              </div>
            </div>
          ) : (
            bands.map((band) => (
              <Card key={band.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    {band.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {band.bio || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {band.albumsCount} album{band.albumsCount !== 1 ? 's' : ''}
                    </div>
                    <div>
                      {band.tracksCount} track{band.tracksCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/band/${band.slug}`}>
                      Manage Band
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
