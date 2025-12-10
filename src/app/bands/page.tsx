import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Music } from 'lucide-react'
import Link from 'next/link'
import { BandsTable } from '@/components/bands-table'

async function getUserBands(userId: string) {
  const supabase = await createClient()

  const { data: bands, error } = await supabase
    .from('bands')
    .select(`
      id,
      name,
      slug,
      bio,
      image_url,
      genre,
      location,
      created_at,
      albums (
        id,
        tracks (
          id
        )
      )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bands:', error)
    return []
  }

  // Transform the data to include counts
  return bands.map(band => ({
    ...band,
    albumsCount: band.albums?.length || 0,
    tracksCount: band.albums?.reduce((total, album) => total + (album.tracks?.length || 0), 0) || 0
  }))
}

export default async function BandsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const bands = await getUserBands(user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-sans text-white mb-2">
            My Bands
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Manage your music projects and band profiles
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <Plus className="w-4 h-4 mr-2" />
            Create Band
          </Link>
        </Button>
      </div>

      {bands.length === 0 ? (
        <Card className="bg-black/20 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-white mb-2">No bands yet</CardTitle>
            <p className="text-muted-foreground font-mono text-sm mb-6 max-w-md">
              Start your music journey by creating your first band. You can upload albums, manage tracks, and build your artist profile.
            </p>
            <Button asChild>
              <Link href="/dashboard">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Band
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Your Bands ({bands.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <BandsTable bands={bands} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
