'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { addTrackToPlaylist } from '@/actions/playlists'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListPlus } from 'lucide-react'
import Link from 'next/link'

type PlaylistRow = { id: string; name: string }

export function AddToPlaylistMenu({ trackId }: { trackId: string }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/60 hover:text-white"
          onClick={(e) => e.stopPropagation()}
          aria-label="Add to playlist"
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black border-white/10 text-white">
        {playlists.length === 0 ? (
          <DropdownMenuItem asChild className="font-mono text-xs focus:bg-white/10">
            <Link href="/collection/playlists">Create your first playlist</Link>
          </DropdownMenuItem>
        ) : (
          playlists.map((p) => (
            <form key={p.id} action={addTrackToPlaylist}>
              <input type="hidden" name="playlistId" value={p.id} />
              <input type="hidden" name="trackId" value={trackId} />
              <DropdownMenuItem asChild className="font-mono text-xs focus:bg-white/10">
                <button type="submit" onClick={(e) => e.stopPropagation()} className="w-full text-left">
                  Add to {p.name}
                </button>
              </DropdownMenuItem>
            </form>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


