import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ListMusic } from 'lucide-react'
import { createPlaylist } from '@/actions/playlists'

export default async function PlaylistsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name, is_public, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-sans text-white mb-2">Playlists</h1>
          <p className="text-muted-foreground font-mono text-sm">Your playlists (public by default)</p>
        </div>

        <form action={createPlaylist}>
          <Button className="bg-white text-black hover:bg-white/90">
            <Plus className="w-4 h-4 mr-2" />
            New playlist
          </Button>
        </form>
      </div>

      {!playlists || playlists.length === 0 ? (
        <Card className="bg-black/20 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ListMusic className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-white mb-2">No playlists yet</CardTitle>
            <p className="text-muted-foreground font-mono text-sm mb-6 max-w-md">
              Create a playlist and start adding songs from any track menu.
            </p>
            <form action={createPlaylist}>
              <Button className="bg-[#ff565f] hover:bg-[#ff565f]/80 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Create your first playlist
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((p) => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="block">
              <Card className="bg-black/20 border-white/10 hover:bg-white/5 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white font-sans truncate">{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-white/60">
                    {p.is_public ? 'Public (logged-in)' : 'Private'} • Updated{' '}
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '--'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


