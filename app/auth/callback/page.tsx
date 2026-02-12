'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { Toaster, toast } from 'sonner'

export default function CallbackPage() {
  const router = useRouter()
  const { session, activeWorkspace } = useAuth()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [isPolling, setIsPolling] = useState(false)
  const pollingStartedRef = useRef(false)

  // Maximum polling attempts (~6 seconds total at 500ms intervals)
  const MAX_ATTEMPTS = 12
  const POLL_INTERVAL = 500

  useEffect(() => {
    // Ensure we only start polling once (React Strict Mode guard)
    if (pollingStartedRef.current) return
    pollingStartedRef.current = true

    const startPolling = async () => {
      try {
        // Get current session to verify user is authenticated
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (!currentSession?.user?.id) {
          console.log('[CALLBACK] No session found, redirecting to login')
          router.replace('/auth/login')
          return
        }

        const userId = currentSession.user.id
        const token = currentSession.access_token
        
        console.log('[CALLBACK] ✅ Session found for user:', userId)
        
        // Step 1: Bootstrap workspace (create profile, workspace, membership)
        console.log('[CALLBACK] 🔄 Running bootstrap endpoint...')
        try {
          const bootstrapResponse = await fetch('/api/bootstrap', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(15000), // 15s timeout for bootstrap
          })

          if (!bootstrapResponse.ok) {
            const errorData = await bootstrapResponse.json()
            console.warn('[CALLBACK] Bootstrap warning:', errorData.error)
            // Continue to polling anyway - workspace might already exist
          } else {
            const bootstrapData = await bootstrapResponse.json()
            console.log('[CALLBACK] ✅ Bootstrap successful:', bootstrapData.workspace_id)
          }
        } catch (bootstrapError) {
          console.warn('[CALLBACK] Bootstrap error (continuing to polling):', bootstrapError)
          // Continue to polling - workspace might already exist
        }

        // Step 2: Poll for workspace membership
        console.log('[CALLBACK] Starting workspace polling...')
        setIsPolling(true)

        // Start polling for workspace membership
        let found = false
        let attempts = 0

        while (attempts < MAX_ATTEMPTS && !found) {
          attempts++
          setAttempt(attempts)

          try {
            // Create service role client to bypass RLS during polling
            const token = currentSession.access_token

            const response = await fetch('/api/auth/workspaces', {
              headers: { Authorization: `Bearer ${token}` },
            })

            if (!response.ok) {
              throw new Error(`Workspaces API error: ${response.status}`)
            }

            const { workspaces } = await response.json()

            if (workspaces && workspaces.length > 0) {
              console.log(`[CALLBACK] ✅ Found ${workspaces.length} workspace(s) on attempt ${attempts}`)
              found = true
              
              // Select first workspace or owned workspace
              const selectedWorkspace = workspaces.find((w: any) => w.owner_id === userId) || workspaces[0]
              
              console.log('[CALLBACK] ✅ Redirecting to operator with workspace:', selectedWorkspace.id)
              setLoading(false)
              
              // Redirect to operator (AuthProvider will handle activeWorkspace selection)
              router.replace('/operator')
              return
            }

            console.log(`[CALLBACK] ⏳ Attempt ${attempts}/${MAX_ATTEMPTS}: No workspaces found yet`)

            // Wait before next attempt
            if (attempts < MAX_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
            }
          } catch (pollError) {
            console.error(`[CALLBACK] Polling attempt ${attempts} error:`, pollError)
            // Continue polling on error
            if (attempts < MAX_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
            }
          }
        }

        // Max attempts reached without finding workspace
        if (!found) {
          console.warn('[CALLBACK] ⚠️  Max polling attempts reached, showing fallback')
          setError('timeout')
          setLoading(false)
          setIsPolling(false)
        }
      } catch (err) {
        console.error('[CALLBACK] Fatal error:', err)
        setError('fatal')
        setLoading(false)
        setIsPolling(false)
      }
    }

    startPolling()
  }, [router])

  // Show loading screen while polling
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <Toaster position="top-right" theme="dark" />
        
        <div className="text-center">
          <div className="inline-block p-3 mb-4">
            <div className="w-12 h-12 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-300 mb-1 font-medium">Preparando tu cuenta…</p>
          <p className="text-sm text-gray-500 mb-4">
            {isPolling && attempt > 0 ? `Intento ${attempt}/${MAX_ATTEMPTS}` : 'Un momento...'}
          </p>
        </div>
      </div>
    )
  }

  // Show fallback UI if polling failed
  if (error) {
    const handleRetry = () => {
      setError('')
      setAttempt(0)
      setIsPolling(true)
      setLoading(true)
      pollingStartedRef.current = false
      window.location.reload()
    }

    const handleBackToLogin = () => {
      router.replace('/auth/login')
    }

    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <Toaster position="top-right" theme="dark" />
        
        <div className="text-center max-w-md">
          <div className="inline-block p-3 bg-yellow-900/20 border border-yellow-800 rounded-full mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <p className="text-gray-300 mb-2 font-medium text-lg">
            Aún estamos preparando tu cuenta
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {error === 'timeout'
              ? 'La configuración está tardando más de lo esperado. Intenta nuevamente.'
              : 'Ocurrió un error al preparar tu cuenta. Por favor reintenta.'}
          </p>
          
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleRetry}
              className="inline-block bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={handleBackToLogin}
              className="inline-block bg-[#333] hover:bg-[#444] text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
