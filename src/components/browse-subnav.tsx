'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const browseLinks = [
  { href: '/browse', label: 'Fresh Pressings' },
  { href: '/browse/top-tracks', label: 'Top tracks' },
]

export function BrowseSubnav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 border-b border-white/10">
      <ul className="flex gap-6">
        {browseLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`inline-flex border-b-2 pb-3 text-sm font-mono transition-colors ${
                  isActive
                    ? 'border-[#ff565f] text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
