'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useWorkspace } from '@/lib/workspace-provider'

interface WorkspaceGateProps {
  children: React.ReactNode
}

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { status, errorCode, workspace, loadWorkspace } = useWorkspace()
  const loadAttemptedRef = useRef(false)

  // Redirect to login if no session and auth loaded
  useEffect(() => {
    if (!authLoading && !session) {
      console.log('[GATE] No session, redirecting to login')
      router.push('/auth/login')
    }
  }, [authLoading, session, router])

  // Load workspace on refresh (when session exists but workspace not loaded)
  useEffect(() => {
    if (session && !workspace && status === 'idle' && !loadAttemptedRef.current) {
      console.log('[GATE] Session exists but no workspace, loading...')
      loadAttemptedRef.current = true
      loadWorkspace()
    }
  }, [session, workspace, status, loadWorkspace])

  // Auth still loading - show minimal spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No session (redirect happening)
  if (!session) {
    return null
  }

  // Workspace ready or loading - render children immediately
  if (status === 'idle' || status === 'loading' || status === 'ready') {
    return <>{children}</>
  }

  // Solo bloqueamos si hay un error real
  if (status === 'error') {
    const isNoWorkspace = errorCode === 'NO_WORKSPACE'
    const isUnauthorized = errorCode === 'UNAUTHORIZED'
    const isTimeout = errorCode === 'TIMEOUT'

    if (isUnauthorized) {
      // 401: redirect to login
      return (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sesión expirada</h2>
            <p className="text-gray-400 mb-6">Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
            >
              Ir a Login
            </button>
          </div>
        </div>
      )
    }

    if (isNoWorkspace) {
      // 404: No workspace
      return (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sin workspace</h2>
            <p className="text-gray-400 mb-6">No tienes ningún workspace creado. Crea uno para continuar.</p>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
            >
              Crear Workspace
            </button>
          </div>
        </div>
      )
    }

    // Error general (incluye TIMEOUT cuando el fetch falló)
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {isTimeout ? 'Timeout cargando workspace' : 'Error cargando workspace'}
          </h2>
          <p className="text-gray-400 mb-6">
            {isTimeout
              ? 'El workspace tardó demasiado en cargar. Por favor, reintenta.'
              : 'Hubo un error al cargar tu workspace. Por favor, reintenta.'}
          </p>
          <button
            onClick={() => {
              loadAttemptedRef.current = false
              loadWorkspace()
            }}
            className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Fallback (no debería llegar aquí)
  return <>{children}</>
}
