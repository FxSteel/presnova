'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/app/providers'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (user) {
      router.replace('/operator')
    } else {
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
      <div className="text-gray-400">Redirigiendo...</div>
    </div>
  )
}
