// Reserved top-level paths that must not be used as band slugs,
// because we are introducing a public route at /:bandSlug.
const RESERVED = new Set(
  [
    'api',
    'login',
    'logout',
    'signup',
    'auth',
    'callback',
    'dashboard',
    'bands',
    'band',
    'albums',
    'album',
    'songs',
    'song',
    'browse',
    'discover',
    'library',
    'studio',
    'search',
    'purchase',
    'donate',
    'download',
    'collection',
    'user',
    'playlist',
    'terms',
    'privacy',
    'robots.txt',
    'sitemap.xml',
    'favicon.ico',
  ].map((s) => s.toLowerCase())
)

export function isReservedBandSlug(slug: string) {
  const s = (slug ?? '').toString().trim().toLowerCase()
  return RESERVED.has(s)
}


