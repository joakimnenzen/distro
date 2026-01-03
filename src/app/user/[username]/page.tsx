import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ListMusic } from 'lucide-react'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Profile is visible to logged-in users only (per MVP decision)
  if (!user) redirect('/login')

  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, slug, avatar_url')
    .eq('slug', username)
    .single()

  if (!profile) notFound()

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name, updated_at')
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })

  const displayName = profile.username?.includes('@')
    ? profile.username.split('@')[0]
    : profile.username || profile.slug

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="bg-white/10 text-white font-mono text-lg">
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold font-sans text-white truncate">{displayName}</h1>
          <p className="text-sm font-mono text-white/50">Public playlists</p>
        </div>
      </div>

      <div className="mt-8">
        {(!playlists || playlists.length === 0) ? (
          <Card className="bg-black/20 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ListMusic className="w-16 h-16 text-muted-foreground mb-4" />
              <CardTitle className="text-white mb-2">No public playlists</CardTitle>
              <p className="text-muted-foreground font-mono text-sm max-w-md">
                This user hasn’t published any playlists yet.
              </p>
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
                      Updated {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '--'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


