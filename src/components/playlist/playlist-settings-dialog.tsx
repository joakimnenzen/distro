'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deletePlaylist, updatePlaylistSettings } from '@/actions/playlists'

export function PlaylistTitleWithSettings({
  playlistId,
  name,
  isPublic,
}: {
  playlistId: string
  name: string
  isPublic: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState(name)
  const [isPrivate, setIsPrivate] = useState(!isPublic)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = useMemo(() => {
    return draftName.trim() !== name.trim() || isPrivate !== !isPublic
  }, [draftName, name, isPrivate, isPublic])

  useEffect(() => {
    if (!open) return
    setDraftName(name)
    setIsPrivate(!isPublic)
    setError(null)
  }, [open, name, isPublic])

  async function onSave() {
    const trimmed = draftName.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const res = await updatePlaylistSettings({
        playlistId,
        name: trimmed,
        isPublic: !isPrivate,
      })

      if (!res.ok) {
        setError(res.error || 'Could not save changes')
        return
      }

      setOpen(false)
      router.refresh()
    } catch (e) {
      setError('Could not save changes')
    } finally {
      setIsSaving(false)
    }
  }

  async function onDelete() {
    const ok = window.confirm('Delete this playlist? This cannot be undone.')
    if (!ok) return

    setIsSaving(true)
    setError(null)
    try {
      const res = await deletePlaylist(playlistId)
      if (!res.ok) {
        setError(res.error || 'Could not delete playlist')
        return
      }
      setOpen(false)
      router.push('/collection/playlists')
      router.refresh()
    } catch (e) {
      setError('Could not delete playlist')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 min-w-0"
      >
        <span className="text-3xl font-bold font-sans text-white truncate group-hover:underline underline-offset-4">
          {name}
        </span>
        <Pencil className="w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit playlist</DialogTitle>
            <DialogDescription className="font-mono text-white/60">
              Rename, change visibility, or delete this playlist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-mono text-white/60">Name</p>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="bg-black border-white/10 font-mono text-white"
                placeholder="Playlist name"
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-sm text-white">Private</p>
                <p className="font-mono text-xs text-white/60 truncate">
                  Only you can view this playlist.
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isSaving} />
            </div>

            {error ? (
              <p className="text-xs font-mono text-red-400">{error}</p>
            ) : null}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => void onDelete()}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => setOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={isSaving || !dirty || !draftName.trim()}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


