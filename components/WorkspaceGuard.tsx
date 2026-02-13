'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useWorkspace } from '@/lib/workspace-provider'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkspaceGuardProps {
  children: React.ReactNode
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { workspaces, activeWorkspaceId, status, error, fetchWorkspaces, createWorkspace } = useWorkspace()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch workspaces when user is authenticated
  useEffect(() => {
    if (user && status === 'idle') {
      fetchWorkspaces()
    }
  }, [user, status, fetchWorkspaces])

  // Don't render anything if no user or still loading auth
  if (!user || authLoading) {
    return null
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block p-3 mb-4">
            <Loader2 className="w-12 h-12 text-[#7C6FD8] animate-spin" />
          </div>
          <p className="text-gray-300 mb-1 font-medium">Cargando workspaces...</p>
          <p className="text-sm text-gray-500">Un momento...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
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

          <p className="text-gray-300 mb-2 font-medium text-lg">Error al cargar workspace</p>
          <p className="text-sm text-gray-400 mb-6">
            {error || 'Ocurrió un error al cargar tu workspace.'}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={() => fetchWorkspaces()}
              className="bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No workspaces state - first time user
  if (status === 'ready' && workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-block p-4 bg-[#7C6FD8]/10 border border-[#7C6FD8]/20 rounded-full mb-6">
            <Plus className="w-8 h-8 text-[#7C6FD8]" />
          </div>

          <h2 className="text-gray-200 mb-3 font-medium text-xl">¡Bienvenido a Nova!</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Necesitas crear tu primer workspace para comenzar a gestionar canciones y presentaciones.
          </p>

          <Button
            onClick={() => createWorkspace()}
            className="bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white px-6 py-3"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear mi primer workspace
          </Button>
        </div>
      </div>
    )
  }

  // Ready with workspaces - render protected content
  if (status === 'ready' && workspaces.length > 0 && activeWorkspaceId) {
    return <>{children}</>
  }

  // Loading active workspace or other edge case
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#7C6FD8] animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Configurando workspace...</p>
      </div>
    </div>
  )
}