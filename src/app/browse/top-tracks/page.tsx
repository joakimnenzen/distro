import { createClient } from '@/lib/supabase-server'
import { Music } from 'lucide-react'
import { BrowseSubnav } from '@/components/browse-subnav'
import { TrackList, type TrackListTrack } from '@/components/track-list'

type TopTrackRow = {
  id: string
  title: string
  file_url: string
  duration: number | null
  play_count: number | null
  albums:
    | {
        id: string
        title: string
        slug: string | null
        cover_image_url: string | null
        bands: {
          name: string
          slug: string
        } | null
      }
    | {
        id: string
        title: string
        slug: string | null
        cover_image_url: string | null
        bands: {
          name: string
          slug: string
        } | null
      }[]
    | null
}

async function getTopTracks(): Promise<TrackListTrack[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tracks')
    .select(
      `
      id,
      title,
      file_url,
      duration,
      play_count,
      album_id,
      albums:album_id (
        id,
        title,
        slug,
        cover_image_url,
        bands:band_id (
          name,
          slug
        )
      )
    `
    )
    .not('file_url', 'is', null)
    .order('play_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) {
    console.error('Error fetching top tracks:', error)
    return []
  }

  return (data as TopTrackRow[]).map((track, index) => {
    const album = Array.isArray(track.albums) ? track.albums[0] : track.albums
    const band = album?.bands && !Array.isArray(album.bands) ? album.bands : null

    return {
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      play_count: track.play_count ?? 0,
      track_number: index + 1,
      album_id: album?.id ?? '',
      album_title: album?.title ?? '',
      album_slug: album?.slug ?? null,
      cover_image_url: album?.cover_image_url ?? null,
      band_name: band?.name ?? '',
      band_slug: band?.slug ?? '',
    }
  })
}

async function getLikedTrackIds(): Promise<string[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('user_track_likes')
    .select('track_id')
    .eq('user_id', user.id)

  if (error || !data) {
    console.error('Error fetching liked tracks:', error)
    return []
  }

  return data.map((row) => row.track_id)
}

export default async function TopTracksPage() {
  const [tracks, likedTrackIds] = await Promise.all([getTopTracks(), getLikedTrackIds()])

  return (
    <div className="container mx-auto py-8">
      <BrowseSubnav />

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-white mb-2">Top tracks</h1>
        <p className="text-muted-foreground font-mono text-sm">
          The most played tracks across Distro, ranked by play count.
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Music className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-sans font-medium text-white mb-2">No tracks yet</h2>
          <p className="text-muted-foreground font-mono text-sm max-w-md">
            Tracks will appear here once artists upload music and listeners start pressing play.
          </p>
        </div>
      ) : (
        <TrackList
          tracks={tracks}
          variant="album"
          hideHeader={true}
          showCoverImage={true}
          linkTitleToAlbum={true}
          showBandNameInAlbumVariant={true}
          likedTrackIds={likedTrackIds}
        />
      )}
    </div>
  )
}
