import { createClient } from '@/lib/supabase-server'
import { getLikedTracks, getLikedTrackIds } from '@/actions/likes'
import { redirect } from 'next/navigation'
import { TrackList } from '@/components/track-list'
import { Heart } from 'lucide-react'

export default async function LikedSongsPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const likedTracks = await getLikedTracks(user.id)
  const likedTrackIds = await getLikedTrackIds(user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-2">
          <Heart className="w-8 h-8 text-[#ff565f] fill-current" />
          <div>
            <h1 className="text-3xl font-semibold font-sans text-white mb-1">
              Liked Songs
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''} &bull; Your personal collection
            </p>
          </div>
        </div>
      </div>

      {likedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-sans font-medium text-white mb-2">
            No liked songs yet
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-md">
            Start exploring music and heart the songs you love. They&apos;ll appear here for easy access.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={likedTracks.map(track => ({
            id: track.id,
            title: track.title,
            file_url: track.file_url,
            duration: track.duration,
            album_id: track.album_id || '',
            album_title: track.album_title || '',
            album_slug: (track as any).album_slug || null,
            band_name: track.band_name || '',
            band_slug: track.band_slug || '',
            cover_image_url: track.cover_image_url || track.album_cover || null,
            liked_at: track.liked_at,
          }))}
          variant="playlist"
          hideHeader={true}
          showCoverImage={true}
          linkTitleToAlbum={true}
          headerInfo={{
            id: 'liked-songs',
            title: 'Liked Songs',
            type: 'liked'
          }}
          likedTrackIds={likedTrackIds}
        />
      )}
    </div>
  )
}
