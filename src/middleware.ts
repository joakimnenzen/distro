import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isReservedBandSlug } from './lib/reserved-slugs'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/browse',
    '/search',
    // Auth pages
    '/login',
    '/signup',
    '/auth',
    // Legal
    '/terms',
    '/privacy',
    // Guest checkout + delivery should be public
    '/purchase',
    '/donate',
    '/download',
  ]

  const pathname = request.nextUrl.pathname

  const isExplicitPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // New public routing:
  // - /:bandSlug
  // - /:bandSlug/:albumSlug
  // We keep protected routes safe by blocking reserved slugs (dashboard, api, albums, etc.)
  const parts = pathname.split('/').filter(Boolean)
  const isPublicBandRoute = parts.length === 1 && !isReservedBandSlug(parts[0])
  const isPublicBandAlbumRoute = parts.length === 2 && !isReservedBandSlug(parts[0])

  const isPublicRoute = isExplicitPublicRoute || isPublicBandRoute || isPublicBandAlbumRoute

  // For public routes, just refresh the session but don't redirect
  if (isPublicRoute) {
    await supabase.auth.getUser()
    return response
  }

  // For protected routes, check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
