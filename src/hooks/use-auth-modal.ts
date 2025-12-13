import { create } from 'zustand'

interface AuthModalState {
  isOpen: boolean
  view: 'signin' | 'signup'
  open: (view?: 'signin' | 'signup') => void
  close: () => void
}

export const useAuthModal = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'signin',
  open: (view = 'signin') => set({ isOpen: true, view }),
  close: () => set({ isOpen: false }),
}))
