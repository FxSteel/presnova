'use client'

import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { WorkspaceGate } from '@/components/WorkspaceGate'

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

    if (!loading && !session) {
      router.replace('/auth/login')
    }
  }, [session, loading, router, mounted])

  if (!mounted || loading) {
    return null
  }

  if (!session) {
    return null
  }

  return (
    <WorkspaceGate>
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </WorkspaceGate>
  )
}
