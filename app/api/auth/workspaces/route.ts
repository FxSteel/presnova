import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service role client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const token = authHeader.replace('Bearer ', '')
    
    // Verify token to get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspaces where user is a member (using service role, no RLS restrictions)
    const { data: memberships, error: membershipsError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)

    if (membershipsError) {
      console.error('[API] Memberships error:', membershipsError)
      return NextResponse.json({ error: membershipsError.message }, { status: 400 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ workspaces: [] })
    }

    const workspaceIds = memberships.map((m: any) => m.workspace_id)

    // Get the workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)

    if (workspacesError) {
      console.error('[API] Workspaces error:', workspacesError)
      return NextResponse.json({ error: workspacesError.message }, { status: 400 })
    }

    return NextResponse.json({ workspaces: workspaces || [] })
  } catch (error) {
    console.error('[API] Workspaces route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
