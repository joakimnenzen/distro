'use server'

import fs from 'fs'
import os from 'os'
import path from 'path'
import archiver from 'archiver'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

function sanitizeFilename(name: string) {
  return name
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function extractStoragePathFromPublicUrl(fileUrl: string, bucket: string) {
  try {
    const u = new URL(fileUrl)
    // Supports:
    // - /storage/v1/object/public/<bucket>/<path>
    // - /storage/v1/object/sign/<bucket>/<path>
    const marker = `/storage/v1/object/`
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null

    const rest = u.pathname.slice(idx + marker.length) // public/<bucket>/...
    const parts = rest.split('/')
    if (parts.length < 3) return null
    const mode = parts[0] // public|sign
    const b = parts[1]
    if (b !== bucket) return null
    const storagePath = parts.slice(2).join('/')
    return storagePath || null
  } catch {
    return null
  }
}

export async function generateAlbumZip(albumId: string): Promise<{ success: true; zipPath: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'You must be logged in' }

    const admin = createAdminClient()

    const { data: album } = await admin
      .from('albums')
      .select('id, title, band_id, is_purchasable, price_ore, download_bucket, download_zip_path')
      .eq('id', albumId)
      .single()

    if (!album) return { success: false, error: 'Album not found' }

    const { data: band } = await admin
      .from('bands')
      .select('id, owner_id, stripe_account_id, stripe_payouts_enabled')
      .eq('id', album.band_id)
      .single()

    if (!band) return { success: false, error: 'Band not found' }
    if (band.owner_id !== user.id) return { success: false, error: 'Not allowed' }

    if (!band.stripe_account_id || !band.stripe_payouts_enabled) {
      return { success: false, error: 'Enable donations for this band before generating a ZIP.' }
    }

    if (!album.is_purchasable || !album.price_ore) {
      return { success: false, error: 'Enable digital sales and set a price before generating a ZIP.' }
    }

    const { data: tracks } = await admin
      .from('tracks')
      .select('id, title, track_number, file_url')
      .eq('album_id', album.id)
      .order('track_number', { ascending: true })

    if (!tracks || tracks.length === 0) {
      return { success: false, error: 'No tracks found for this album' }
    }

    const tmpDir = os.tmpdir()
    const tmpZipPath = path.join(tmpDir, `distro-${album.id}.zip`)

    // Create zip
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(tmpZipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => resolve())
      output.on('error', (err) => reject(err))
      archive.on('error', (err) => reject(err))

      archive.pipe(output)

      const audioBucket = 'audio'

      void (async () => {
        try {
          for (const t of tracks) {
            if (!t.file_url) continue
            const storagePath = extractStoragePathFromPublicUrl(t.file_url, audioBucket)
            if (!storagePath) {
              throw new Error('Could not parse audio storage path for one of the tracks.')
            }

            const ext = path.extname(storagePath) || '.mp3'
            const trackNum = String(t.track_number ?? 0).padStart(2, '0')
            const baseName = sanitizeFilename(t.title || `Track ${trackNum}`)
            const fileName = `${trackNum} - ${baseName}${ext}`

            const { data: blob, error: dlError } = await admin.storage.from(audioBucket).download(storagePath)
            if (dlError || !blob) {
              throw new Error(`Failed to download track audio: ${dlError?.message || fileName}`)
            }

            const arrayBuffer = await (blob as any).arrayBuffer()
            const buf = Buffer.from(arrayBuffer)

            archive.append(buf, { name: fileName })
          }

          await archive.finalize()
        } catch (e) {
          reject(e)
        }
      })()
    })

    // Upload zip to downloads bucket
    const downloadBucket = (album.download_bucket as string) || 'downloads'
    const zipName = `${sanitizeFilename(album.title || 'album')}.zip`
    const uploadPath = `${album.band_id}/${album.id}/${zipName}`

    const zipBuf = await fs.promises.readFile(tmpZipPath)
    const { error: upError } = await admin.storage
      .from(downloadBucket)
      .upload(uploadPath, zipBuf, { contentType: 'application/zip', upsert: true })

    if (upError) {
      console.error('[generateAlbumZip] upload error', upError)
      return {
        success: false,
        error:
          `Failed to upload ZIP to bucket "${downloadBucket}". ` +
          `Make sure the bucket exists (recommended private).`,
      }
    }

    await admin
      .from('albums')
      .update({
        download_bucket: downloadBucket,
        download_zip_path: uploadPath,
      })
      .eq('id', album.id)

    // Cleanup
    await fs.promises.unlink(tmpZipPath).catch(() => {})

    return { success: true, zipPath: uploadPath }
  } catch (e) {
    console.error('[generateAlbumZip] error', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to generate ZIP' }
  }
}


