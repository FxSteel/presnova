'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string
  name: string
  slug: string
  role: WorkspaceRole
  created_at?: string
}

export interface WorkspaceState {
  // State
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  
  // Actions
  fetchWorkspaces: () => Promise<void>
  setActiveWorkspace: (workspaceId: string) => void
  createWorkspace: (name?: string) => Promise<Workspace | null>
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

interface WorkspaceProviderProps {
  children: React.ReactNode
  user: User | null
}

export function WorkspaceProvider({ children, user }: WorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [status, setStatus] = useState<WorkspaceState['status']>('idle')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load active workspace from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('activeWorkspaceId')
    if (saved) {
      setActiveWorkspaceId(saved)
    }
  }, [])

  // Save active workspace to localStorage
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('activeWorkspaceId', activeWorkspaceId)
    } else {
      localStorage.removeItem('activeWorkspaceId')
    }
  }, [activeWorkspaceId])

  const fetchWorkspaces = async (): Promise<void> => {
    if (!user) {
      console.log('[WORKSPACE-PROVIDER] No user, skipping fetch')
      return
    }

    console.log('[WORKSPACE-PROVIDER] Fetching workspaces...')
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch('/api/workspaces')
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('[WORKSPACE-PROVIDER] Not authenticated')
          setStatus('idle')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const fetchedWorkspaces = data.workspaces || []
      const defaultId = data.defaultWorkspaceId

      console.log('[WORKSPACE-PROVIDER] Fetched', fetchedWorkspaces.length, 'workspaces')
      
      setWorkspaces(fetchedWorkspaces)
      
      // Set active workspace if none is set or current is not valid
      if (!activeWorkspaceId && defaultId) {
        setActiveWorkspaceId(defaultId)
      } else if (activeWorkspaceId && !fetchedWorkspaces.find((w: Workspace) => w.id === activeWorkspaceId)) {
        setActiveWorkspaceId(defaultId || null)
      }

      setStatus('ready')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspaces'
      console.error('[WORKSPACE-PROVIDER] Error:', errorMessage)
      setError(errorMessage)
      setStatus('error')
    }
  }

  const setActiveWorkspace = (workspaceId: string): void => {
    console.log('[WORKSPACE-PROVIDER] Setting active workspace:', workspaceId)
    setActiveWorkspaceId(workspaceId)
  }

  const createWorkspace = async (name?: string): Promise<Workspace | null> => {
    if (!user) {
      toast.error('Authentication required')
      return null
    }

    console.log('[WORKSPACE-PROVIDER] Creating workspace...')
    
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication required')
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const newWorkspace = data.workspace

      console.log('[WORKSPACE-PROVIDER] ✅ Workspace created:', newWorkspace.id)
      
      // Add to current workspaces and set as active
      setWorkspaces(prev => [newWorkspace, ...prev])
      setActiveWorkspaceId(newWorkspace.id)
      
      toast.success(`Workspace "${newWorkspace.name}" created`)
      return newWorkspace

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace'
      console.error('[WORKSPACE-PROVIDER] Create error:', errorMessage)
      toast.error('Failed to create workspace')
      return null
    }
  }

  const refreshWorkspaces = async (): Promise<void> => {
    await fetchWorkspaces()
  }

  const contextValue: WorkspaceState = {
    workspaces,
    activeWorkspaceId,
    status,
    error,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    refreshWorkspaces,
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
  const { workspaces, activeWorkspaceId } = useWorkspace()
  return workspaces.find(w => w.id === activeWorkspaceId) || null
}