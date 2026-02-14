'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-provider'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string
  name: string
  slug: string
  role: WorkspaceRole
  owner_id: string
}

export interface WorkspaceState {
  // State
  workspace: Workspace | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorCode: string | null
  
  // Computed
  activeWorkspaceId: string | null
  
  // Actions
  setWorkspace: (workspace: Workspace) => void
  clearWorkspace: () => void
  loadWorkspace: () => Promise<Workspace | null>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

interface WorkspaceProviderProps {
  children: React.ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { session } = useAuth()
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [status, setStatus] = useState<WorkspaceState['status']>('idle')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const loadingRef = useRef(false)

  const setWorkspace = useCallback((ws: Workspace) => {
    setWorkspaceState(ws)
    setStatus('ready')
    setErrorCode(null)
    localStorage.setItem('activeWorkspaceId', ws.id)
  }, [])

  const clearWorkspace = useCallback(() => {
    setWorkspaceState(null)
    setStatus('idle')
    setErrorCode(null)
    localStorage.removeItem('activeWorkspaceId')
  }, [])

  /**
   * Load workspace from API. Called explicitly:
   * - After login (from login page)
   * - On refresh of protected route (from guard)
   */
  const loadWorkspace = useCallback(async (): Promise<Workspace | null> => {
    if (!session?.access_token) {
      console.log('[WS] No session, cannot load workspace')
      setStatus('error')
      setErrorCode('NO_SESSION')
      return null
    }

    // If already loaded, return cached
    if (workspace && status === 'ready') {
      console.log('[WS] Already loaded, returning cached')
      return workspace
    }

    // Guard against double calls (React Strict Mode)
    if (loadingRef.current) {
      console.log('[WS] Already loading, skipping')
      return null
    }

    try {
      loadingRef.current = true
      setStatus('loading')
      setErrorCode(null)

      console.log('[WS] Fetching workspace...')
      const response = await fetch('/api/workspaces/active', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const code = data.code || `HTTP_${response.status}`
        console.error('[WS] Load failed:', code, data.error)
        setStatus('error')
        setErrorCode(code)
        return null
      }

      const data = await response.json()
      const ws = data.workspace as Workspace

      console.log('[WS] ✅ Loaded workspace:', ws.id, ws.name)
      setWorkspaceState(ws)
      setStatus('ready')
      setErrorCode(null)
      localStorage.setItem('activeWorkspaceId', ws.id)
      
      return ws
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[WS] Load error:', message)
      setStatus('error')
      setErrorCode('FETCH_ERROR')
      return null
    } finally {
      loadingRef.current = false
    }
  }, [session?.access_token, workspace, status])

  const contextValue: WorkspaceState = {
    workspace,
    status,
    errorCode,
    activeWorkspaceId: workspace?.id ?? null,
    setWorkspace,
    clearWorkspace,
    loadWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceState {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Helper hook to get current workspace
export function useActiveWorkspace(): Workspace | null {
  const { workspace } = useWorkspace()
  return workspace
}
