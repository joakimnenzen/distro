'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, Search, LogOut, Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuthModal } from '@/hooks/use-auth-modal'

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileSlug, setProfileSlug] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { open: openAuthModal } = useAuthModal()

  // Fetch user profile on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)

        // Fetch profile data for avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, slug')
          .eq('id', user.id)
          .single()

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
        if (profile?.slug) setProfileSlug(profile.slug)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, slug')
          .eq('id', session.user.id)
          .single()

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
        if (profile?.slug) setProfileSlug(profile.slug)
      } else {
        setUser(null)
        setAvatarUrl(null)
        setProfileSlug(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Sync input value with URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const q = urlParams.get('q') || ''
    setInputValue(q)
    setSearchQuery(q)
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (inputValue === searchQuery) return // No change

    setIsSearching(true)

    const timeoutId = setTimeout(() => {
      setSearchQuery(inputValue)
      if (inputValue.trim()) {
        router.replace(`/search?q=${encodeURIComponent(inputValue.trim())}`)
      } else {
        router.replace('/search')
      }
      setIsSearching(false)
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      setIsSearching(false)
    }
  }, [inputValue, searchQuery, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Immediate search on Enter
      const query = inputValue.trim()
      if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      } else {
        router.push('/search')
      }
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        return
      }

      // Clear local state immediately
      setUser(null)
      setAvatarUrl(null)

      // Redirect to login page
      router.replace('/login')
    } catch (error) {
      console.error('Unexpected logout error:', error)
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="w-full sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: History Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-white/10"
            onClick={() => router.forward()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Search */}
        <div className="flex-1 md:max-w-md mr-8 md:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search music..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleSearch}
              className="pl-10 pr-10 h-10 rounded-full bg-white/5 border-white/20 font-mono text-sm placeholder:text-muted-foreground focus:border-white/30 focus:bg-white/10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* Right: User Menu or Auth Buttons */}
        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={user.email} />
                    <AvatarFallback className="bg-white/10 text-white font-mono text-xs">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-black/90 border-white/20 backdrop-blur-xl" align="end">
                {profileSlug ? (
                  <>
                    <DropdownMenuItem
                      className="font-mono text-sm text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => router.push(`/user/${profileSlug}`)}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                ) : null}
                <DropdownMenuItem
                  className="font-mono text-sm text-red-400 hover:bg-red-400/10 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal('signin')}
                className="font-mono text-sm hover:bg-white/10"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => openAuthModal('signup')}
                className="font-mono text-sm bg-[#ff565f] hover:bg-[#ff565f]/80 text-black"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
