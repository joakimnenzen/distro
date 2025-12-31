import { notFound } from 'next/navigation'
interface PageProps {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    stripe?: string
  }>
}

export default async function BandPage({ params, searchParams }: PageProps) {
  // Legacy route intentionally disabled (new canonical: /:bandSlug)
  // Per product decision: no legacy URL support.
  void params
  void searchParams
  notFound()
}
