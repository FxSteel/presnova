'use client'

import React, { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-provider'
import { WorkspaceProvider } from '@/lib/workspace-provider'

export { AuthProvider, useAuth } from '@/lib/auth-provider'
export { useWorkspace } from '@/lib/workspace-context'

/**
 * Root provider component that wraps the entire app.
 * Combines AuthProvider and WorkspaceProvider in the correct hierarchy.
 */
interface RootProvidersProps {
  children: ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <AuthProvider>
      <WorkspaceProviderWrapper>
        {children}
      </WorkspaceProviderWrapper>
    </AuthProvider>
  )
}

/**
 * Wrapper to safely access useAuth inside WorkspaceProvider
 */
function WorkspaceProviderWrapper({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  return (
    <WorkspaceProvider user={user} session={session}>
      {children}
    </WorkspaceProvider>
  )
}
