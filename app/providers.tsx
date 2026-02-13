'use client'

import React, { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-provider'

export { AuthProvider, useAuth } from '@/lib/auth-provider'
export { useWorkspace } from '@/lib/workspace-context'

/**
 * Root provider component that wraps the entire app.
 * Only includes AuthProvider. WorkspaceProvider is only mounted in protected routes.
 */
interface RootProvidersProps {
  children: ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
