'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

function normalizeName(name: unknown) {
  const s = typeof name === 'string' ? name.trim() : ''
  return s || 'New playlist'
}

function isDuplicateError(err: any) {
  return err?.code === '23505' || String(err?.message || '').toLowerCase().includes('duplicate')
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')
  return { supabase, user }
}

export async function createPlaylist(formData?: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const name = normalizeName(formData?.get('name'))

  await supabase.from('playlists').insert({
    owner_id: user.id,
    name,
    is_public: true,
  })

  revalidatePath('/collection/playlists')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
}

export async function createPlaylistWithName(name: string): Promise<{ id: string }> {
  const { supabase, user } = await requireUser()
  const normalized = normalizeName(name)

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      owner_id: user.id,
      name: normalized,
      is_public: true,
    })
    .select('id')
    .single()

  if (error || !data?.id) {
    console.error('[createPlaylistWithName] insert error', error)
    throw new Error('Failed to create playlist')
  }

  revalidatePath('/collection/playlists')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')

  return { id: data.id }
}

export async function renamePlaylist(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const playlistId = formData.get('playlistId')?.toString()
  const name = normalizeName(formData.get('name'))
  if (!playlistId) return

  await supabase.from('playlists').update({ name }).eq('id', playlistId).eq('owner_id', user.id)

  revalidatePath(`/playlist/${playlistId}`)
  revalidatePath('/collection/playlists')
  revalidatePath('/', 'layout')
}

export async function updatePlaylistSettings(input: {
  playlistId: string
  name: string
  isPublic: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, user } = await requireUser()
    const playlistId = input?.playlistId?.toString()
    if (!playlistId) return { ok: false, error: 'Missing playlist id' }

    const name = normalizeName(input?.name)
    const isPublic = !!input?.isPublic

    const { error } = await supabase
      .from('playlists')
      .update({ name, is_public: isPublic })
      .eq('id', playlistId)
      .eq('owner_id', user.id)

    if (error) {
      console.error('[updatePlaylistSettings] update error', error)
      return { ok: false, error: 'Failed to update playlist' }
    }

    revalidatePath(`/playlist/${playlistId}`)
    revalidatePath('/collection/playlists')
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    console.error('[updatePlaylistSettings] unexpected error', e)
    return { ok: false, error: 'Failed to update playlist' }
  }
}

export async function deletePlaylist(playlistId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, user } = await requireUser()
    const id = playlistId?.toString()
    if (!id) return { ok: false, error: 'Missing playlist id' }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) {
      console.error('[deletePlaylist] delete error', error)
      return { ok: false, error: 'Failed to delete playlist' }
    }

    revalidatePath('/collection/playlists')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    console.error('[deletePlaylist] unexpected error', e)
    return { ok: false, error: 'Failed to delete playlist' }
  }
}

export async function addTrackToPlaylist(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const playlistId = formData.get('playlistId')?.toString()
  const trackId = formData.get('trackId')?.toString()
  if (!playlistId || !trackId) return

  // Ensure the playlist belongs to the user (RLS enforces, but this keeps position calc scoped).
  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('owner_id', user.id)
    .single()
  if (!playlist) return

  const { data: maxRow } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPos = (maxRow?.position ?? 0) + 1

  // Ignore duplicates (PK conflict)
  const { error: insertErr } = await supabase
    .from('playlist_tracks')
    .insert({ playlist_id: playlistId, track_id: trackId, position: nextPos })
  if (insertErr && !isDuplicateError(insertErr)) {
    console.error('[addTrackToPlaylist] insert error', insertErr)
  }

  revalidatePath(`/playlist/${playlistId}`)
  revalidatePath('/collection/playlists')
  revalidatePath('/', 'layout')
}

export async function addTrackToPlaylistResult(input: {
  playlistId: string
  trackId: string
}): Promise<
  | { status: 'added' }
  | { status: 'exists' }
  | { status: 'error'; error: string }
> {
  try {
    const { supabase, user } = await requireUser()
    const playlistId = input?.playlistId?.toString()
    const trackId = input?.trackId?.toString()
    if (!playlistId || !trackId) return { status: 'error', error: 'Missing ids' }

    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('owner_id', user.id)
      .single()
    if (!playlist) return { status: 'error', error: 'Playlist not found' }

    const { data: maxRow } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPos = (maxRow?.position ?? 0) + 1

    const { error: insertErr } = await supabase
      .from('playlist_tracks')
      .insert({ playlist_id: playlistId, track_id: trackId, position: nextPos })

    if (insertErr) {
      if (isDuplicateError(insertErr)) {
        return { status: 'exists' }
      }
      console.error('[addTrackToPlaylistResult] insert error', insertErr)
      return { status: 'error', error: 'Failed to add track' }
    }

    revalidatePath(`/playlist/${playlistId}`)
    revalidatePath('/collection/playlists')
    revalidatePath('/', 'layout')
    return { status: 'added' }
  } catch (e) {
    console.error('[addTrackToPlaylistResult] unexpected error', e)
    return { status: 'error', error: 'Failed to add track' }
  }
}

export async function removeTrackFromPlaylist(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const playlistId = formData.get('playlistId')?.toString()
  const trackId = formData.get('trackId')?.toString()
  if (!playlistId || !trackId) return

  await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)

  // Touch playlist ownership via RLS; also keep page fresh.
  await supabase.from('playlists').select('id').eq('id', playlistId).eq('owner_id', user.id).maybeSingle()

  revalidatePath(`/playlist/${playlistId}`)
  revalidatePath('/collection/playlists')
  revalidatePath('/', 'layout')
}

export async function reorderPlaylist(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const playlistId = formData.get('playlistId')?.toString()
  const ordered = formData.getAll('trackId').map((v) => v.toString()).filter(Boolean)
  if (!playlistId || ordered.length === 0) return

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('owner_id', user.id)
    .single()
  if (!playlist) return

  // Update sequentially (small lists). For large lists, we'd batch via RPC.
  for (let i = 0; i < ordered.length; i++) {
    await supabase
      .from('playlist_tracks')
      .update({ position: i + 1 })
      .eq('playlist_id', playlistId)
      .eq('track_id', ordered[i])
  }

  revalidatePath(`/playlist/${playlistId}`)
  revalidatePath('/collection/playlists')
}

export async function addAlbumToPlaylist(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()
  const playlistId = formData.get('playlistId')?.toString()
  const albumId = formData.get('albumId')?.toString()
  if (!playlistId || !albumId) return

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('owner_id', user.id)
    .single()
  if (!playlist) return

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('album_id', albumId)
    .order('track_number', { ascending: true })

  if (!tracks || tracks.length === 0) return

  const { data: maxRow } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  let pos = (maxRow?.position ?? 0) + 1
  for (const t of tracks) {
    const { error: e } = await supabase
      .from('playlist_tracks')
      .insert({ playlist_id: playlistId, track_id: t.id, position: pos })
    if (e && !isDuplicateError(e)) {
      console.error('[addAlbumToPlaylist] insert error', e)
    }
    pos++
  }

  revalidatePath(`/playlist/${playlistId}`)
  revalidatePath('/collection/playlists')
  revalidatePath('/', 'layout')
}


