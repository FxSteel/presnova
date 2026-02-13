'use client'

import { WorkspaceProvider } from '@/lib/workspace-provider'

interface WorkspaceGateProps {
  children: React.ReactNode
}

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  // WorkspaceProvider now gets user/session from useAuth internally
  return (
    <WorkspaceProvider>
      {children}
    </WorkspaceProvider>
  )
}
