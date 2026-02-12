'use client'

import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Only redirect if explicitly no session (not while loading)
    if (session === null) {
      router.replace('/auth/login')
    }
  }, [session, router, mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    )
  }

  // If session exists, render layout (even if workspace is still loading)
  if (session) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    )
  }
}
