import { create } from 'zustand'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: string
  created_at: string
}

export interface WorkspaceSettings {
  workspace_id: string
  theme_mode?: string
  language?: string
  logo_url?: string
}

export interface Song {
  id: string
  workspace_id: string
  created_by: string | null
  title: string
  author: string | null
  tonality: string | null
  bpm: number | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface SongSlide {
  id: string
  song_id: string
  position: number
  type: string
  label: string | null
  content: string
  created_at: string
  updated_at: string
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  activeWorkspace: Workspace | null
  setActiveWorkspace: (workspace: Workspace | null) => void
  selectedSong: Song | null
  setSelectedSong: (song: Song | null) => void
  logoMode: 'ON' | 'OFF'
  setLogoMode: (mode: 'ON' | 'OFF') => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  activeWorkspace: null,
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  selectedSong: null,
  setSelectedSong: (song) => set({ selectedSong: song }),
  logoMode: 'OFF',
  setLogoMode: (mode) => set({ logoMode: mode }),
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
