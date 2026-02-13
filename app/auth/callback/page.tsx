'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { CheckCircle } from 'lucide-react'
import { Toaster } from 'sonner'

export default function CallbackPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [countdown, setCountdown] = useState(3)

  // Redirect when session is confirmed
  useEffect(() => {
    if (session) {
      console.log('[CALLBACK] ✅ Session confirmed, starting redirect countdown')
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            // Redirect to / which will bootstrap workspace
            router.replace('/')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [session, router])

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

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <Toaster />
      <div className="text-center">
        <div className="inline-block w-12 h-12 mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h1>
        <p className="text-gray-400 mb-4">Redirigiendo en {countdown} segundos...</p>
        <div className="text-sm text-gray-500">
          Si no se redirige automáticamente,{' '}
          <button
            onClick={() => router.replace('/')}
            className="text-[#7C6FD8] hover:underline"
          >
            haz clic aquí
          </button>
        </div>
      </div>
    </div>
  )
}