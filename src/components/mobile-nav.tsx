'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Disc, Heart, Home, Music2, ListMusic } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: (pathname: string) => boolean
}

const items: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    isActive: (p) => p === '/',
  },
  {
    href: '/browse',
    label: 'Browse',
    icon: Music2,
    isActive: (p) => p.startsWith('/browse'),
  },
  {
    href: '/collection/tracks',
    label: 'Songs',
    icon: Heart,
    isActive: (p) => p.startsWith('/collection/tracks'),
  },
    {
      href: '/collection/albums',
      label: 'Albums',
      icon: Disc,
      isActive: (p) => p.startsWith('/collection/albums'),
    },
    {
      href: '/collection/playlists',
      label: 'Playlists',
      icon: ListMusic,
      isActive: (p) => p.startsWith('/collection/playlists'),
    },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.isActive(pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex flex-col items-center justify-center gap-1 py-3',
                'text-[11px] font-mono',
                active ? 'text-white' : 'text-white/45 hover:text-white/70',
              ].join(' ')}
            >
              <Icon className={active ? 'h-6 w-6' : 'h-6 w-6'} />
              <span className="leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

