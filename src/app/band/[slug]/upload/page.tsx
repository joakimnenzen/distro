import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import { AlbumUploadForm } from '@/components/album-upload-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getBand(slug: string, userId: string) {
  const supabase = await createClient()

  const { data: band, error } = await supabase
    .from('bands')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', userId)
    .single()

  if (error) {
    return null
  }

  return band
}

interface UploadPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function UploadPage({ params }: UploadPageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { slug } = await params
  const band = await getBand(slug, user.id)

  if (!band) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Upload Album</h1>
          <p className="text-muted-foreground mt-2">
            Add a new album to <strong>{band.name}</strong> with cover art and audio tracks
          </p>
        </div>

        <AlbumUploadForm
          bandId={band.id}
          bandSlug={band.slug}
          donationsEnabled={Boolean(band.stripe_account_id && band.stripe_payouts_enabled)}
        />
      </div>
    </div>
  )
}
