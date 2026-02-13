'use client'

import Sidebar from '@/components/layout/Sidebar'
import { WorkspaceGuard } from '@/components/WorkspaceGuard'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceGuard>
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </WorkspaceGuard>
  )
}

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
