import { create } from 'zustand'
import { supabase } from './supabase'

export interface WorkspaceMembership {
  workspace_id: string
  role: string
  created_at: string
}

interface WorkspaceStore {
  activeWorkspaceId: string | null
  memberships: WorkspaceMembership[]
  loading: boolean
  error: string | null
  
  // Actions
  bootstrapWorkspace: () => Promise<void>
  setActiveWorkspaceId: (id: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

const STORAGE_KEY = 'nova.activeWorkspaceId'

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  activeWorkspaceId: null,
  memberships: [],
  loading: false,
  error: null,

  bootstrapWorkspace: async () => {
    try {
      set({ loading: true, error: null })

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user?.id) {
        console.error('[WORKSPACE] User not authenticated')
        set({ activeWorkspaceId: null, memberships: [], loading: false })
        return
      }

      const userId = user.id
      console.log('[WORKSPACE] Bootstrap for user:', userId)

      // Fetch workspace memberships
      const { data: memberships, error: membersError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (membersError) {
        console.error('[WORKSPACE] Error fetching memberships:', membersError)
        set({ activeWorkspaceId: null, memberships: [], loading: false, error: membersError.message })
        return
      }

      set({ memberships: memberships || [] })

      if (!memberships || memberships.length === 0) {
        console.warn('[WORKSPACE] User has no workspace memberships')
        set({ activeWorkspaceId: null, loading: false })
        return
      }

      // Try to use saved activeWorkspaceId from localStorage
      const savedWorkspaceId = localStorage.getItem(STORAGE_KEY)

      let selectedWorkspaceId = null

      if (
        savedWorkspaceId &&
        memberships.some((m) => m.workspace_id === savedWorkspaceId)
      ) {
        console.log('[WORKSPACE] Using saved workspace:', savedWorkspaceId)
        selectedWorkspaceId = savedWorkspaceId
      } else {
        // Use the first (most recent) workspace
        selectedWorkspaceId = memberships[0]?.workspace_id
        console.log('[WORKSPACE] Using first workspace:', selectedWorkspaceId)
      }

      if (selectedWorkspaceId) {
        localStorage.setItem(STORAGE_KEY, selectedWorkspaceId)
        set({ activeWorkspaceId: selectedWorkspaceId, loading: false })
        console.log('[WORKSPACE] ✅ Bootstrap complete:', selectedWorkspaceId)
      } else {
        set({ activeWorkspaceId: null, loading: false })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[WORKSPACE] Bootstrap error:', message)
      set({ activeWorkspaceId: null, memberships: [], loading: false, error: message })
    }
  },

  setActiveWorkspaceId: async (id: string) => {
    const { memberships } = get()

    // Validate that the id exists in memberships
    if (!memberships.some((m) => m.workspace_id === id)) {
      console.error('[WORKSPACE] Invalid workspace ID:', id)
      return
    }

    localStorage.setItem(STORAGE_KEY, id)
    set({ activeWorkspaceId: id })
    console.log('[WORKSPACE] Active workspace changed to:', id)
  },

  refreshWorkspaces: async () => {
    // Re-run bootstrap to refresh memberships and revalidate activeWorkspaceId
    await get().bootstrapWorkspace()
  },
}))
