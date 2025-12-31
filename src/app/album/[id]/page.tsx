import { notFound } from 'next/navigation'
interface AlbumPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  // Legacy route intentionally disabled (new canonical: /:bandSlug/:albumSlug)
  void params
  notFound()
}
