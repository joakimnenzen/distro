import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()
  const tokenHash = hashToken(token)

  // Find token + purchase + album delivery info
  const { data: row } = await admin
    .from('download_tokens')
    .select(
      `
      id,
      used_at,
      expires_at,
      purchases (
        id,
        status,
        albums (
          download_bucket,
          download_zip_path
        )
      )
    `
    )
    .eq('token_hash', tokenHash)
    .single()

  const purchase = row?.purchases ? (Array.isArray(row.purchases) ? row.purchases[0] : row.purchases) : null
  const album = purchase?.albums ? (Array.isArray(purchase.albums) ? purchase.albums[0] : purchase.albums) : null

  if (!row || !purchase || !album) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (purchase.status !== 'paid') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!album.download_bucket || !album.download_zip_path)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (row.used_at) {
    return NextResponse.json({ error: 'Link already used' }, { status: 410 })
  }

  const expiresAt = new Date(row.expires_at as any).getTime()
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  // Mark token used (best-effort; also prevents re-use)
  const { data: marked, error: markError } = await admin
    .from('download_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('used_at', null)
    .select('id')

  if (markError || !marked || marked.length !== 1) {
    return NextResponse.json({ error: 'Link already used' }, { status: 410 })
  }

  const { data: signed, error: signError } = await admin.storage
    .from(album.download_bucket)
    .createSignedUrl(album.download_zip_path, 60 * 10) // 10 minutes

  if (signError || !signed?.signedUrl) {
    console.error('[download] createSignedUrl error', signError)
    return NextResponse.json({ error: 'Failed to create download' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}


