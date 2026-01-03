'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Music,
  Heart,
  Disc,
  Mic,
  LayoutDashboard
} from 'lucide-react'
import { SidebarPlaylists } from '@/components/sidebar-playlists'

interface SidebarLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function SidebarLink({ href, icon: Icon, children }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-sm
        ${isActive
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  )
}

export function Sidebar() {
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(true)
  const [isLibraryOpen, setIsLibraryOpen] = useState(true)
  const [isStudioOpen, setIsStudioOpen] = useState(true)

  return (
    <div className="flex flex-col h-full bg-black border-r border-white/10">
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <img
            src="/distro_logo.svg"
            alt="Distro"
            className="h-5 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-4">
        {/* Discover Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsDiscoverOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs font-medium text-white/60 hover:text-white hover:bg-white/5"
            aria-expanded={isDiscoverOpen}
          >
            <span>Discover</span>
          </button>

          {isDiscoverOpen ? (
            <div className="space-y-1">
              <SidebarLink href="/" icon={Home}>
                Home
              </SidebarLink>
              <SidebarLink href="/browse" icon={Music}>
                Browse
              </SidebarLink>
            </div>
          ) : null}
        </div>

        {/* Library Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsLibraryOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs font-medium text-white/60 hover:text-white hover:bg-white/5"
            aria-expanded={isLibraryOpen}
          >
            <span>Library</span>
          </button>

          {isLibraryOpen ? (
            <div className="space-y-1">
              <SidebarLink href="/collection/tracks" icon={Heart}>
                Liked Songs
              </SidebarLink>
              <SidebarLink href="/collection/albums" icon={Disc}>
                Saved Albums
              </SidebarLink>
            </div>
          ) : null}
        </div>

        {/* Playlists Section */}
        <SidebarPlaylists />

        {/* Studio Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsStudioOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs font-medium text-white/60 hover:text-white hover:bg-white/5"
            aria-expanded={isStudioOpen}
          >
            <span>Studio</span>
          </button>

          {isStudioOpen ? (
            <div className="space-y-1">
              <SidebarLink href="/dashboard" icon={LayoutDashboard}>
                Dashboard
              </SidebarLink>
              <SidebarLink href="/bands" icon={Mic}>
                Bands
              </SidebarLink>
              <SidebarLink href="/albums" icon={Disc}>
                Albums
              </SidebarLink>
            </div>
          ) : null}
        </div>
      </nav>

      {/* Footer/Version */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs font-mono text-white/30">
          v1.0.0
        </p>
      </div>
    </div>
  )
}
