'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useWorkspace } from '@/lib/workspace-context'
import { CheckCircle } from 'lucide-react'
import { Toaster } from 'sonner'

export default function CallbackPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { activeWorkspaceId, status } = useWorkspace()
  const [countdown, setCountdown] = useState(3)

  // Redirect when workspace is ready
  useEffect(() => {
    if (session && status === 'ready' && activeWorkspaceId) {
      console.log('[CALLBACK] ✅ Workspace ready, starting redirect countdown')
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            router.replace('/operator')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [session, status, activeWorkspaceId, router])

  // Loading states
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Confirmando email...</h2>
          <p className="text-gray-400">Procesando confirmación</p>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Configurando workspace...</h2>
          <p className="text-gray-400">Esto puede tomar unos segundos</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error de configuración</h2>
          <p className="text-gray-400 mb-6">No se pudo configurar tu workspace</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  // Success - redirect countdown
  if (status === 'ready' && activeWorkspaceId) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">¡Email confirmado!</h2>
          <p className="text-gray-400 mb-6">Tu cuenta ha sido activada exitosamente</p>
          
          <div className="bg-[#2a2a2a] border border-[#333] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-2">
              Redirigiendo al operador en <span className="text-[#7C6FD8] font-semibold">{countdown}</span> segundo{countdown !== 1 ? 's' : ''}
            </p>
            <div className="w-full bg-[#333] rounded-full h-2">
              <div 
                className="bg-[#7C6FD8] h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((4 - countdown) / 3) * 100}%` }}
              />
            </div>
          </div>
          
          <button
            onClick={() => router.replace('/operator')}
            className="px-6 py-3 bg-[#7C6FD8] hover:bg-[#6B5FCC] text-white rounded-lg font-medium transition-colors"
          >
            Ir ahora
          </button>
        </div>
        <Toaster />
      </div>
    )
  }

  // Default loading
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}