'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { addAlbumToPlaylist } from '@/actions/playlists'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type PlaylistRow = { id: string; name: string }

export function AddAlbumToPlaylist({ albumId }: { albumId: string }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (!uid) return

      const { data: rows } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('owner_id', uid)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (!cancelled) setPlaylists((rows as any) ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  if (!userId) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Add all to playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-sans">Add album to playlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {playlists.length === 0 ? (
            <p className="text-xs font-mono text-white/60">Create a playlist first (Sidebar → Playlists → +)</p>
          ) : (
            playlists.map((p) => (
              <form key={p.id} action={addAlbumToPlaylist}>
                <input type="hidden" name="playlistId" value={p.id} />
                <input type="hidden" name="albumId" value={albumId} />
                <Button type="submit" className="w-full justify-start bg-white text-black hover:bg-white/90">
                  Add to {p.name}
                </Button>
              </form>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


