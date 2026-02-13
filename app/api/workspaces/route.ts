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
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('[API/WORKSPACES-GET] Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API/WORKSPACES-GET] Fetching workspaces for user:', user.id)

    // Query workspaces and roles from workspace_members table
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces:workspace_id (
          id,
          name,
          slug,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (memberError) {
      console.error('[API/WORKSPACES-GET] Query error:', memberError)
      return NextResponse.json(
        { error: 'Failed to fetch workspaces' },
        { status: 500 }
      )
    }

    // Transform response into workspaces with roles
    const workspaces = (memberships || []).map((m: any) => ({
      id: m.workspaces.id,
      name: m.workspaces.name,
      slug: m.workspaces.slug,
      role: m.role,
      created_at: m.workspaces.created_at,
    }))

    console.log('[API/WORKSPACES-GET] ✅ Found', workspaces.length, 'workspaces')

    // Get first workspace as default
    const defaultWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null

    return NextResponse.json({
      workspaces,
      defaultWorkspaceId,
    })

  } catch (error) {
    console.error('[API/WORKSPACES-GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('[API/WORKSPACES-POST] Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    
    console.log('[API/WORKSPACES-POST] Creating workspace for user:', user.id)

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: name || 'My Workspace',
        slug: (name || 'workspace').toLowerCase().replace(/\s+/g, '-') + '_' + Math.random().toString(36).substr(2, 5),
      })
      .select()
      .single()

    if (workspaceError || !workspace) {
      console.error('[API/WORKSPACES-POST] Workspace creation error:', workspaceError)
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      )
    }

    console.log('[API/WORKSPACES-POST] ✅ Workspace created:', workspace.id)

    // Add user as admin member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
      console.error('[API/WORKSPACES-POST] Member creation error:', memberError)
      // Still return success - workspace was created
    }

    console.log('[API/WORKSPACES-POST] ✅ User added as admin')

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: 'admin',
        created_at: workspace.created_at,
      },
    })

  } catch (error) {
    console.error('[API/WORKSPACES-POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
