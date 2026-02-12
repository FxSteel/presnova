import { supabase } from './supabase'
import { User, Workspace } from './store'

/**
 * DEPRECATED: This file is maintained for backwards compatibility only.
 * 
 * The workspace bootstrap logic has been moved to the server-side endpoint:
 * POST /api/bootstrap
 * 
 * This endpoint:
 * - Requires Authorization Bearer token
 * - Uses Service Role Key to bypass RLS
 * - Performs idempotent upserts on profiles, workspaces, and workspace_members
 * - Prevents stack depth limit errors by running server-side
 * 
 * Client should call /api/bootstrap after successful signInWithPassword
 * instead of using ensureWorkspaceForUser() directly.
 * 
 * See app/providers.tsx signIn() for the correct flow.
 */

/**
 * @deprecated Use POST /api/bootstrap instead
 * 
 * This function was vulnerable to RLS stack depth errors when called from client.
 * Kept for reference but should not be used.
 */
export async function ensureWorkspaceForUser(
  userId: string,
  email: string,
  fullName?: string
): Promise<{
  workspace: Workspace
  isNewWorkspace: boolean
} | null> {
  console.warn(
    '[DEPRECATED] ensureWorkspaceForUser() called from client. Use POST /api/bootstrap instead.'
  )
  throw new Error(
    'ensureWorkspaceForUser() is deprecated. The bootstrap flow has been moved to the server. Please use the /api/bootstrap endpoint instead.'
  )
}
