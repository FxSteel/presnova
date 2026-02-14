'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useWorkspace } from '@/lib/workspace-provider'

interface WorkspaceGuardProps {
  children: React.ReactNode
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { status, errorCode } = useWorkspace()

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.replace('/auth/login')
    return null
  }

  // Don't render anything if still loading auth
  if (authLoading) {
    return null
  }

  // Workspace loading or ready - show children immediately (no blocking)
  if (status === 'idle' || status === 'loading' || status === 'ready') {
    return <>{children}</>
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
            {errorCode === 'NO_WORKSPACE'
              ? 'No tienes ningún workspace creado'
              : errorCode === 'UNAUTHORIZED'
                ? 'Tu sesión ha expirado'
                : 'Ocurrió un error al cargar tu workspace'}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
            {errorCode === 'UNAUTHORIZED' && (
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return <>{children}</>
}