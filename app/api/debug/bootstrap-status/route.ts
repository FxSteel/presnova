import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/debug/bootstrap-status
 * 
 * Debug endpoint to check bootstrap status for authenticated user
 * Returns profile, workspace, and membership data
 * 
 * Only works with Authorization Bearer token
 * DEV ONLY - remove in production
 */

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAdmin = serviceRoleKey && supabaseUrl
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export async function GET(request: NextRequest) {
  try {
    // Only in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 503 }
      )
    }

    // Get user from token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Check profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Check workspace membership
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', userId)

    // Check workspaces if memberships exist
    let workspaces = null
    if (memberships && memberships.length > 0) {
      const { data: ws } = await supabaseAdmin
        .from('workspaces')
        .select('*')
        .in('id', memberships.map((m) => m.workspace_id))

      workspaces = ws
    }

    return NextResponse.json(
      {
        user_id: userId,
        user_email: user.email,
        profile: profile || { error: profileError?.message },
        memberships: memberships || { error: memberError?.message },
        workspaces: workspaces || null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal error',
        message: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    )
  }
}
