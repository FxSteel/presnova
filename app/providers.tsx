'use client'

import React, { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-provider'
import { WorkspaceProvider } from '@/lib/workspace-provider'

export { AuthProvider, useAuth } from '@/lib/auth-provider'
export { useWorkspace, useActiveWorkspace } from '@/lib/workspace-provider'

/**
 * Root provider component that wraps the entire app.
 * Includes AuthProvider and WorkspaceProvider.
 */
interface RootProvidersProps {
  children: ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        {children}
      </WorkspaceProvider>
    </AuthProvider>
  )
}
