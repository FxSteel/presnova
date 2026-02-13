'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'
import { useWorkspace } from '@/lib/workspace-context'
import { usePathname } from 'next/navigation'

interface WorkspaceBootstrapProps {
  children: React.ReactNode
}

export function WorkspaceBootstrap({ children }: WorkspaceBootstrapProps) {
  const { session, user } = useAuth()
  const { status, activeWorkspaceId, workspaces, error, fetchWorkspaces } = useWorkspace()
  const didRunRef = useRef(false)
  const pathname = usePathname()

  // Only bootstrap when user actually needs workspace (not on login/auth pages)
  const needsWorkspace = session && user && !pathname.startsWith('/auth')

  // Trigger workspace fetch when session is ready
  useEffect(() => {
    if (needsWorkspace && !didRunRef.current && status === 'idle') {
      console.log('[WORKSPACE-BOOTSTRAP] Fetching workspaces for user:', user?.id)
      didRunRef.current = true
      fetchWorkspaces()
    }
  }, [needsWorkspace, status, user?.id, fetchWorkspaces])

  // Reset on session change
  useEffect(() => {
    if (!session) {
      didRunRef.current = false
    }
  }, [session])

  // If on auth pages, don't show workspace-related UI
  if (pathname.startsWith('/auth') || !needsWorkspace) {
    return <>{children}</>
  }

  // Loading state - only show when user actually needs workspace
  if (session && status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Preparando workspace...</h2>
          <p className="text-gray-400">Esto puede tomar unos segundos</p>
        </div>
      </div>
    )
  }

  // Error state
  if (session && status === 'error') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error de workspace</h2>
          <p className="text-gray-400 mb-6">{error || 'Error desconocido'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Success - render children with workspace data available
  if (session && status === 'ready' && activeWorkspaceId) {
    console.log('[WORKSPACE-BOOTSTRAP] 🎉 Rendering app with workspace:', { 
      activeWorkspaceId, 
      workspaceCount: workspaces.length
    })
    return <>{children}</>
  }

  // Default loading fallback for protected routes
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
