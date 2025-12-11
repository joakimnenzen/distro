import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateBandDialog } from '@/components/create-band-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Music, Users } from 'lucide-react'
import { DashboardClient } from '@/components/dashboard-client'

async function getUserBands(userId: string) {
  const supabase = await createClient()

  const { data: bands, error } = await supabase
    .from('bands')
    .select(`
      *,
      albums (
        id,
        tracks (id)
      )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bands:', error)
    return []
  }

  return bands.map(band => ({
    ...band,
    albumsCount: band.albums?.length || 0,
    tracksCount: band.albums?.reduce((total: number, album: any) => total + (album.tracks?.length || 0), 0) || 0,
  }))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.log('No user found, redirecting to login')
    redirect('/login')
  }

  const bands = await getUserBands(user.id)

  return <DashboardClient bands={bands} />
}
