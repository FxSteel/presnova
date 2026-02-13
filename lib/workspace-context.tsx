// Re-export from workspace-provider for backwards compatibility
export {
  WorkspaceProvider,
  useWorkspace,
  useActiveWorkspace,
  type WorkspaceState,
  type Workspace,
  type WorkspaceRole
} from '@/lib/workspace-provider'

// For compatibility with old imports
export interface WorkspaceData {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member'
  created_at?: string
}

export interface WorkspaceMembership {
  workspace_id: string
  role: 'owner' | 'admin' | 'member'
  created_at?: string
}
