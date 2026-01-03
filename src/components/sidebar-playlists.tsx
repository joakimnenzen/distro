'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, MoreHorizontal, ListMusic } from 'lucide-react'
import { createPlaylistWithName } from '@/actions/playlists'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type PlaylistRow = { id: string; name: string; updated_at: string | null }

export function SidebarPlaylists() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([])
  const [showCount, setShowCount] = useState<number>(10)
  const [sortMode, setSortMode] = useState<'manual' | 'last_edited'>('last_edited')
  const [isOpen, setIsOpen] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      setUserId(data.user?.id ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('playlists')
      .select('id, name, updated_at')
      .eq('owner_id', uid)
      .order('updated_at', { ascending: false })

    setPlaylists((data as any) ?? [])
  }, [supabase])

  useEffect(() => {
    if (!userId) return
    void load(userId)
    const interval = window.setInterval(() => void load(userId), 20_000)
    return () => window.clearInterval(interval)
  }, [userId, load])

  const visible = useMemo(() => {
    const sorted =
      sortMode === 'last_edited'
        ? [...playlists].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
        : [...playlists].sort((a, b) => a.name.localeCompare(b.name))
    return sorted.slice(0, showCount)
  }, [playlists, showCount, sortMode])

  if (!userId) return null

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setCreateError('Name is required')
      return
    }

    setIsCreating(true)
    setCreateError(null)
    try {
      const { id } = await createPlaylistWithName(trimmed)
      setCreateOpen(false)
      setNewName('')
      router.push(`/playlist/${id}`)
    } catch (e) {
      setCreateError('Could not create playlist. Try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs font-medium text-white/60 hover:text-white hover:bg-white/5"
          aria-expanded={isOpen}
        >
          <span>Playlists</span>
        </button>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border-white/10 text-white" align="end">
              <DropdownMenuItem
                onClick={() => setSortMode('manual')}
                className="font-mono text-xs focus:bg-white/10"
              >
                Sort: Manual {sortMode === 'manual' ? '✓' : ''}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortMode('last_edited')}
                className="font-mono text-xs focus:bg-white/10"
              >
                Sort: Last edited {sortMode === 'last_edited' ? '✓' : ''}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => setShowCount(10)} className="font-mono text-xs focus:bg-white/10">
                Show: 10 {showCount === 10 ? '✓' : ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCount(25)} className="font-mono text-xs focus:bg-white/10">
                Show: 25 {showCount === 25 ? '✓' : ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCount(999)} className="font-mono text-xs focus:bg-white/10">
                Show: All {showCount === 999 ? '✓' : ''}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/60 hover:text-white"
                onClick={() => {
                  setCreateError(null)
                  setNewName('')
                  setCreateOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black border-white/10 text-white font-mono text-xs"
            >
              New Playlist
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(v) => {
        if (!v) {
          setCreateError(null)
          setIsCreating(false)
        }
        setCreateOpen(v)
      }}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-mono">New playlist</DialogTitle>
            <DialogDescription className="font-mono text-white/60">
              Name your playlist. You can rename it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name"
              className="bg-black border-white/10 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCreate()
                }
              }}
              disabled={isCreating}
            />
            {createError ? (
              <p className="text-xs font-mono text-red-400">{createError}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isOpen ? <div className="space-y-1">
        {visible.map((p) => (
          <Link
            key={p.id}
            href={`/playlist/${p.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <ListMusic className="h-4 w-4 text-white/40" />
            <span className="truncate">{p.name}</span>
          </Link>
        ))}

        <Link
          href="/collection/playlists"
          className="block px-3 py-2 rounded-lg font-mono text-xs text-white/40 hover:text-white/70 hover:bg-white/5"
        >
          View all
        </Link>
      </div> : null}
      </div>
    </TooltipProvider>
  )
}


