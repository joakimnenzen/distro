import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Player } from '@/components/player'
import { TopBar } from '@/components/top-bar'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { AuthModal } from '@/components/auth/auth-modal'
import { MobileNav } from '@/components/mobile-nav'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: 'Distro - Music Streaming for Artists',
  description: 'A lo-fi, artist-centric music streaming platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-black text-white antialiased`}>
        <div className="flex h-screen overflow-hidden bg-black text-white">
          {/* Sidebar (Hidden on mobile, visible on md+) */}
          <aside className="hidden md:flex flex-col w-64 border-r border-white/10">
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <TopBar /> {/* Sticky Top Bar lives here now */}
            <main className="flex-1 px-0 md:px-2 lg:px-6 pb-[160px] md:pb-24">
              {children}
            </main>
          </div>
        </div>

        {/* Player sits on top of everything */}
        <Player />

        {/* Mobile bottom nav (sits below mini-player) */}
        <MobileNav />

        {/* Toaster for notifications */}
        <Toaster />

        {/* Auth Modal - Available globally */}
        <AuthModal />

        {/* Vercel Speed Insights */}
        <SpeedInsights />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
