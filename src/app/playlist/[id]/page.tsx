import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { TrackList } from '@/components/track-list'
import { Button } from '@/components/ui/button'
import { removeTrackFromPlaylist } from '@/actions/playlists'
import { ListMusic } from 'lucide-react'
import { PlaylistTitleWithSettings } from '@/components/playlist/playlist-settings-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlaylistPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { id } = await params

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id, name, owner_id, is_public, updated_at')
    .eq('id', id)
    .single()

  if (!playlist) notFound()

  const isOwner = playlist.owner_id === user.id

  const { data: rows } = await supabase
    .from('playlist_tracks')
    .select(
      `
      position,
      tracks (
        id,
        title,
        file_url,
        duration,
        track_number,
        play_count,
        album_id,
        albums (
          id,
          slug,
          title,
          cover_image_url,
          bands (
            name,
            slug
          )
        )
      )
    `
    )
    .eq('playlist_id', playlist.id)
    .order('position', { ascending: true })

  const tracks = (rows || [])
    .map((r: any) => {
      const t = r.tracks
      if (!t?.id) return null
      const album = Array.isArray(t.albums) ? t.albums[0] : t.albums
      const band = Array.isArray(album?.bands) ? album.bands[0] : album?.bands

      return {
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: r.position,
        play_count: t.play_count ?? null,
        album_id: t.album_id ?? album?.id,
        album_title: album?.title,
        album_slug: album?.slug ?? null,
        band_name: band?.name ?? '',
        band_slug: band?.slug ?? '',
        cover_image_url: album?.cover_image_url ?? null,
      }
    })
    .filter(Boolean) as any[]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <ListMusic className="w-6 h-6 text-[#ff565f]" />
            {isOwner ? (
              <PlaylistTitleWithSettings
                playlistId={playlist.id}
                name={playlist.name}
                isPublic={!!playlist.is_public}
              />
            ) : (
              <h1 className="text-3xl font-bold font-sans text-white truncate">{playlist.name}</h1>
            )}
          </div>
          <p className="mt-2 text-sm font-mono text-white/60">
            {playlist.is_public ? 'Public Playlist' : 'Private Playlist'} • {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-10 text-center">
          <p className="text-white font-sans text-lg">Empty playlist</p>
          <p className="mt-2 text-white/60 font-mono text-sm">
            Add songs from any track menu (… → Add to playlist).
          </p>
        </div>
      ) : (
        <>
          <TrackList
            tracks={tracks}
            variant="playlist"
            hideHeader={true}
            hideDateAdded={true}
            showCoverImage={true}
            linkTitleToAlbum={true}
          />

          {isOwner && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-mono text-white/60">
                Remove tracks (temporary): use the button list below.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tracks.map((t) => (
                  <form key={t.id} action={removeTrackFromPlaylist}>
                    <input type="hidden" name="playlistId" value={playlist.id} />
                    <input type="hidden" name="trackId" value={t.id} />
                    <Button type="submit" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      Remove “{t.title}”
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


