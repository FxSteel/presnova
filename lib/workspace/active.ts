import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
export interface WorkspaceMembership {
  workspace_id: string
  role: string
  created_at: string
}

export interface WorkspaceInfo {
  id: string
  name: string
  slug: string
}

export interface ResolveResult {
  status: 'OK' | 'NO_SESSION' | 'NO_WORKSPACE' | 'ERROR'
  activeWorkspaceId?: string
  workspace?: WorkspaceInfo
  memberships?: WorkspaceMembership[]
  error?: string
}

// Single-flight control
let inFlight: Promise<ResolveResult> | null = null

// Storage key
const STORAGE_KEY = 'nova.activeWorkspaceId'

// Backoff timings (ms): 300, 500, 700, 900, 1100, 1300, 1500, 1700
const RETRY_DELAYS = [300, 500, 700, 900, 1100, 1300, 1500, 1700]
const MAX_RETRIES = RETRY_DELAYS.length

/**
 * Single source of truth for active workspace resolution
 * Handles race conditions, retries, and localStorage persistence
 */
export async function resolveActiveWorkspace(): Promise<ResolveResult> {
  // Single-flight: if already running, return the same promise
  if (inFlight) {
    return inFlight
  }

  const requestId = typeof crypto !== 'undefined' 
    ? crypto.randomUUID().substring(0, 8)
    : Math.random().toString(36).substring(2, 10)

  inFlight = (async (): Promise<ResolveResult> => {
    try {
      console.log(`[WORKSPACE][${requestId}] START`)

      // A) Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user?.id) {
        console.log(`[WORKSPACE][${requestId}] NO_SESSION error=${userError?.message}`)
        return { status: 'NO_SESSION', error: userError?.message }
      }

      const userId = user.id
      console.log(`[WORKSPACE][${requestId}] START userId=${userId}`)

      // B) Query memberships with retry logic for race conditions
      let memberships: WorkspaceMembership[] = []
      let lastError: any = null

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[WORKSPACE][${requestId}] TRY #${attempt + 1}`)

          const { data, error: membersError } = await supabase
            .from('workspace_members')
            .select('workspace_id, role, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (membersError) {
            // Real error (permissions, RLS, etc) - not a race condition
            console.error(`[WORKSPACE][${requestId}] ERROR permission/RLS:`, membersError)
            toast.error('No tienes permisos o tu sesión no está lista')
            return { 
              status: 'ERROR', 
              error: `Permission error: ${membersError.message}` 
            }
          }

          memberships = data || []
          console.log(`[WORKSPACE][${requestId}] TRY #${attempt + 1} memberships=${memberships.length}`)

          // If we found memberships, break the retry loop
          if (memberships.length > 0) {
            break
          }

          // If no memberships and this is the last attempt, stop
          if (attempt === MAX_RETRIES) {
            console.warn(`[WORKSPACE][${requestId}] NO_WORKSPACE after retries`)
            return { status: 'NO_WORKSPACE', memberships: [] }
          }

          // Wait before next retry
          const delay = RETRY_DELAYS[attempt]
          await new Promise(resolve => setTimeout(resolve, delay))

        } catch (err) {
          lastError = err
          console.error(`[WORKSPACE][${requestId}] TRY #${attempt + 1} error:`, err)
          
          // If this is the last attempt, return error
          if (attempt === MAX_RETRIES) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error(`[WORKSPACE][${requestId}] ERROR ${message}`)
            return { status: 'ERROR', error: message }
          }

          // Wait before retry
          const delay = RETRY_DELAYS[attempt]
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      // C) No memberships found after retries
      if (memberships.length === 0) {
        console.warn(`[WORKSPACE][${requestId}] NO_WORKSPACE after retries`)
        return { status: 'NO_WORKSPACE', memberships: [] }
      }

      // D) Determine active workspace ID
      let activeWorkspaceId: string

      // Try to use saved workspace from localStorage (client-side only)
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && memberships.some(m => m.workspace_id === saved)) {
          activeWorkspaceId = saved
          console.log(`[WORKSPACE][${requestId}] ACTIVE from localStorage=${activeWorkspaceId}`)
        } else {
          // Use most recent membership
          activeWorkspaceId = memberships[0].workspace_id
          localStorage.setItem(STORAGE_KEY, activeWorkspaceId)
          console.log(`[WORKSPACE][${requestId}] ACTIVE first=${activeWorkspaceId}`)
        }
      } else {
        // Server-side: use first membership
        activeWorkspaceId = memberships[0].workspace_id
        console.log(`[WORKSPACE][${requestId}] ACTIVE server-first=${activeWorkspaceId}`)
      }

      // E) Load workspace info
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .eq('id', activeWorkspaceId)
        .single()

      if (workspaceError) {
        console.error(`[WORKSPACE][${requestId}] ERROR loading workspace:`, workspaceError)
        return { 
          status: 'ERROR', 
          error: `Workspace load error: ${workspaceError.message}` 
        }
      }

      console.log(`[WORKSPACE][${requestId}] SUCCESS workspaceId=${activeWorkspaceId} name=${workspaceData.name}`)

      return {
        status: 'OK',
        activeWorkspaceId,
        workspace: workspaceData,
        memberships
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[WORKSPACE][${requestId}] FATAL ERROR:`, err)
      return { status: 'ERROR', error: message }
    } finally {
      // Clear single-flight lock
      inFlight = null
    }
  })()

  return inFlight
}

/**
 * Change active workspace (client-side only)
 */
export function setActiveWorkspaceId(workspaceId: string, memberships: WorkspaceMembership[]): boolean {
  if (typeof window === 'undefined') return false

  // Validate that workspace exists in memberships
  if (!memberships.some(m => m.workspace_id === workspaceId)) {
    console.error('[WORKSPACE] Invalid workspace ID:', workspaceId)
    return false
  }

  localStorage.setItem(STORAGE_KEY, workspaceId)
  console.log('[WORKSPACE] Changed active workspace:', workspaceId)
  return true
}

/**
 * Clear workspace state (logout)
 */
export function clearActiveWorkspace(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  console.log('[WORKSPACE] Cleared active workspace')
}

/**
 * Get current active workspace from localStorage
 */
export function getStoredActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}