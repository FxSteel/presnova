import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode'

/**
 * POST /api/bootstrap
 * 
 * Server-side workspace bootstrap for authenticated users.
 * Idempotent operation: safe to call multiple times.
 * 
 * Flow:
 * 1. Verify user is authenticated (via Authorization header)
 * 2. Upsert profile (id, email, full_name, role)
 * 3. Upsert workspace (owner_id, name, slug)
 * 4. Upsert workspace_members (workspace_id, user_id, role='admin')
 * 5. Return workspace_id and status
 * 
 * Uses Service Role Key to bypass RLS policies
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!serviceRoleKey || !supabaseUrl) {
  console.warn('[BOOTSTRAP] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL')
}

const supabaseAdmin = serviceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

/**
 * Generate a URL-safe slug
 */
function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `workspace-${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin client is configured
    if (!supabaseAdmin) {
      console.error('[BOOTSTRAP] Admin client not configured')
      return NextResponse.json(
        { error: 'Bootstrap not configured', code: 'BOOTSTRAP_UNCONFIGURED' },
        { status: 503 }
      )
    }

    // Extract user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Extract user ID from JWT token
    let userId: string | null = null
    let userEmail: string | null = null
    let fullName: string | null = null

    try {
      // Decode token to get user info from JWT claims
      const decoded = jwtDecode<{ sub: string; email: string; user_metadata?: { full_name?: string } }>(token)
      userId = decoded.sub
      userEmail = decoded.email

      if (!userId) {
        console.error('[BOOTSTRAP] No sub claim in token')
        return NextResponse.json(
          { error: 'Invalid token', code: 'INVALID_TOKEN' },
          { status: 401 }
        )
      }

      console.log(`[BOOTSTRAP] ✅ Token decoded, user ID: ${userId}, email: ${userEmail}`)
    } catch (err) {
      console.error('[BOOTSTRAP] Token decode error:', err)
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    console.log(`[BOOTSTRAP] Starting for user: ${userId}`)

    // ============================================
    // STEP 1: Upsert Profile
    // ============================================
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: userEmail,
          full_name: fullName || null,
          role: 'operator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error(`[BOOTSTRAP] ❌ Profile upsert error:`, profileError)
      return NextResponse.json(
        {
          error: 'Failed to setup profile',
          code: 'PROFILE_ERROR',
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    console.log(`[BOOTSTRAP] ✅ Profile upserted for user: ${userId}`)

    // ============================================
    // STEP 2: Upsert Workspace
    // ============================================
    const workspaceName = fullName ? `${fullName}'s Workspace` : 'Workspace'
    const baseSlug = generateSlug(fullName || userEmail)

    // Try to find existing workspace owned by this user
    const { data: existingWorkspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    let workspaceId: string

    if (existingWorkspace?.id) {
      // User already has a workspace, use it
      workspaceId = existingWorkspace.id
      console.log(`[BOOTSTRAP] ✅ Workspace already exists: ${workspaceId}`)
    } else {
      // Create new workspace
      const { data: newWorkspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: workspaceName,
          slug: baseSlug,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (workspaceError) {
        // Might be slug conflict, try with timestamp
        if (workspaceError.code === '23505') {
          // Unique violation
          const uniqueSlug = `${baseSlug}-${Date.now()}`
          const { data: retryWorkspace, error: retryError } = await supabaseAdmin
            .from('workspaces')
            .insert({
              name: workspaceName,
              slug: uniqueSlug,
              owner_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (retryError) {
            console.error('[BOOTSTRAP] Workspace creation retry error:', retryError)
            return NextResponse.json(
              {
                error: 'Failed to create workspace',
                code: 'WORKSPACE_ERROR',
                details: retryError.message,
              },
              { status: 500 }
            )
          }

          if (!retryWorkspace?.id) {
            return NextResponse.json(
              { error: 'Workspace created but no ID returned', code: 'WORKSPACE_NO_ID' },
              { status: 500 }
            )
          }

          workspaceId = retryWorkspace.id
        } else {
          console.error('[BOOTSTRAP] Workspace creation error:', workspaceError)
          return NextResponse.json(
            {
              error: 'Failed to create workspace',
              code: 'WORKSPACE_ERROR',
              details: workspaceError.message,
            },
            { status: 500 }
          )
        }
      } else {
        if (!newWorkspace?.id) {
          return NextResponse.json(
            { error: 'Workspace created but no ID returned', code: 'WORKSPACE_NO_ID' },
            { status: 500 }
          )
        }

        workspaceId = newWorkspace.id
        console.log(`[BOOTSTRAP] ✅ Workspace created: ${workspaceId}`)
      }
    }

    // ============================================
    // STEP 3: Upsert Workspace Member
    // ============================================
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,user_id' }
      )

    if (memberError) {
      console.error('[BOOTSTRAP] ❌ Member upsert error:', memberError)
      return NextResponse.json(
        {
          error: 'Failed to setup workspace membership',
          code: 'MEMBER_ERROR',
          details: memberError.message,
        },
        { status: 500 }
      )
    }

    console.log(`[BOOTSTRAP] ✅ Member upserted: ${workspaceId} / ${userId}`)

    // ============================================
    // SUCCESS
    // ============================================
    console.log(`[BOOTSTRAP] ✅ Complete for user: ${userId}`)

    return NextResponse.json(
      {
        success: true,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'admin',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[BOOTSTRAP] ❌ Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
