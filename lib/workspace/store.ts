import { create } from 'zustand'
import { resolveActiveWorkspace, clearActiveWorkspace, type ResolveResult, type WorkspaceInfo, type WorkspaceMembership } from './active'

interface WorkspaceState {
  // State
  activeWorkspaceId: string | null
  workspace: WorkspaceInfo | null
  memberships: WorkspaceMembership[]
  loading: boolean
  status: 'IDLE' | 'OK' | 'NO_SESSION' | 'NO_WORKSPACE' | 'ERROR'
  error: string | null

  // Actions
  init: () => Promise<void>
  retry: () => Promise<void>
  clear: () => void
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  // Initial state
  activeWorkspaceId: null,
  workspace: null,
  memberships: [],
  loading: false,
  status: 'IDLE',
  error: null,

  // Initialize workspace (call resolveActiveWorkspace)
  init: async () => {
    const currentState = get()
    
    // Prevent multiple simultaneous calls
    if (currentState.loading) return

    set({ loading: true, error: null })

    try {
      const result: ResolveResult = await resolveActiveWorkspace()

      set({
        loading: false,
        status: result.status,
        activeWorkspaceId: result.activeWorkspaceId || null,
        workspace: result.workspace || null,
        memberships: result.memberships || [],
        error: result.error || null
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[WORKSPACE-STORE] Init error:', err)
      
      set({
        loading: false,
        status: 'ERROR',
        activeWorkspaceId: null,
        workspace: null,
        memberships: [],
        error: message
      })
    }
  },

  // Retry workspace resolution
  retry: async () => {
    await get().init()
  },

  // Clear workspace state (logout)
  clear: () => {
    clearActiveWorkspace()
    set({
      activeWorkspaceId: null,
      workspace: null,
      memberships: [],
      loading: false,
      status: 'IDLE',
      error: null
    })
  }
}))