import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.log('[API/WORKSPACES/ACTIVE] No auth header')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract and verify token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log('[API/WORKSPACES/ACTIVE] Invalid token:', userError?.message)
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    console.log('[AUTH] session ok - user:', user.id)
    console.log('[WS] fetching active workspace')

    const startTime = Date.now()

    // Step 1: Get workspace memberships for this user (simple query, no join)
    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)

    if (membershipError) {
      console.error('[WS] error', { code: 'QUERY_ERROR', message: membershipError.message })
      return NextResponse.json(
        { error: 'Failed to fetch workspace membership', code: 'QUERY_ERROR' },
        { status: 500 }
      )
    }

    // Check if user has any workspaces
    if (!memberships || memberships.length === 0) {
      console.log('[WS] error', { code: 'NO_WORKSPACE', message: 'User has no workspaces' })
      return NextResponse.json(
        { error: 'No workspace found', code: 'NO_WORKSPACE' },
        { status: 404 }
      )
    }

    const membership = memberships[0]
    
    // Step 2: Get workspace details separately (avoids RLS recursion)
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, slug, owner_id')
      .eq('id', membership.workspace_id)
      .single()

    if (workspaceError || !workspaceData) {
      console.error('[WS] error', { code: 'WORKSPACE_NOT_FOUND', message: workspaceError?.message })
      return NextResponse.json(
        { error: 'Workspace not found', code: 'WORKSPACE_NOT_FOUND' },
        { status: 404 }
      )
    }

    const workspace = {
      id: workspaceData.id,
      name: workspaceData.name,
      slug: workspaceData.slug,
      role: membership.role,
      owner_id: workspaceData.owner_id,
    }

    const elapsed = Date.now() - startTime
    console.log('[WS] active workspace loaded', { id: workspace.id, elapsedMs: elapsed })

    return NextResponse.json(
      { workspace },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[API/WORKSPACES/ACTIVE] Error:', errorMessage)
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
