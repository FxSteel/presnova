'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useWorkspaceStore } from '@/lib/workspace-store'

interface WorkspaceGateProps {
  children: React.ReactNode
}

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const { session, loading: authLoading } = useAuth()
  const { activeWorkspaceId, loading: workspaceLoading, bootstrapWorkspace, error } = useWorkspaceStore()
  const router = useRouter()
  const bootstrappedRef = useRef(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      console.log('[WORKSPACE-GATE] No session, redirecting to login')
      router.replace('/auth/login')
    }
  }, [session, authLoading, router])

  // Bootstrap workspace once after session is established
  useEffect(() => {
    if (!session || bootstrappedRef.current) return

    bootstrappedRef.current = true
    console.log('[WORKSPACE-GATE] Bootstrapping workspace...')
    bootstrapWorkspace()
  }, [session, bootstrapWorkspace])

  // Loading state - waiting for workspace to be determined
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block p-3 mb-4">
            <div className="w-12 h-12 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-300 mb-1 font-medium">Preparando workspace…</p>
          <p className="text-sm text-gray-500">Un momento...</p>
        </div>
      </div>
    )
  }

  // No workspace found
  if (!activeWorkspaceId) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-block p-3 bg-red-900/20 border border-red-800 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <p className="text-gray-300 mb-2 font-medium text-lg">No hay workspace</p>
          <p className="text-sm text-gray-400 mb-6">
            {error ? `Error: ${error}` : 'No se encontró un workspace disponible.'}
          </p>

          <button
            onClick={() => router.push('/auth/login')}
            className="inline-block bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Volver a Login
          </button>
        </div>
      </div>
    )
  }

  // Workspace ready - render children
  return <>{children}</>
}
