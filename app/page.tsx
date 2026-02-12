'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'

export default function Home() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    // Only redirect once
    if (redirectedRef.current) return

    if (!loading) {
      redirectedRef.current = true
      if (session) {
        router.replace('/operator')
      } else {
        router.replace('/auth/login')
      }
    }
  }, [loading, session, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <div className="text-gray-400">Redirigiendo...</div>
    </div>
  )
}
