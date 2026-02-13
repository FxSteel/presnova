'use client'

import { useAuth } from '@/app/providers'
import { WorkspaceProvider } from '@/lib/workspace-provider'

interface WorkspaceGateProps {
  children: React.ReactNode
}

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const { user, session } = useAuth()

  // Always render WorkspaceProvider, let it handle the user state
  return (
    <WorkspaceProvider user={user} session={session}>
      {children}
    </WorkspaceProvider>
  )
}
