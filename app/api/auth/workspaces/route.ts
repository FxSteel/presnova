import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('[WORKSPACES] Missing authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service role client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const token = authHeader.replace('Bearer ', '')
    
    // Extract user ID from JWT token
    let userId: string | null = null
    
    try {
      // Decode token to get user ID from sub claim
      const decoded = jwtDecode<{ sub: string }>(token)
      userId = decoded.sub
      
      if (!userId) {
        console.error('[WORKSPACES] No sub claim in token')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      console.log(`[WORKSPACES] ✅ Token decoded, user ID: ${userId}`)
    } catch (err) {
      console.error('[WORKSPACES] Token decode error:', err)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[WORKSPACES] Fetching workspaces for user: ${userId}`)

    // Get workspaces where user is a member (using service role, no RLS restrictions)
    const { data: memberships, error: membershipsError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)

    if (membershipsError) {
      console.error('[WORKSPACES] Memberships error:', membershipsError)
      return NextResponse.json({ error: membershipsError.message }, { status: 400 })
    }

    console.log(`[WORKSPACES] Found ${memberships?.length || 0} memberships`)

    if (!memberships || memberships.length === 0) {
      console.warn(`[WORKSPACES] ⚠️ No memberships found for user ${userId}`)
      return NextResponse.json({ workspaces: [] })
    }

    const workspaceIds = memberships.map((m: any) => m.workspace_id)

    // Get the workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)

    if (workspacesError) {
      console.error('[WORKSPACES] Workspaces error:', workspacesError)
      return NextResponse.json({ error: workspacesError.message }, { status: 400 })
    }

    console.log(`[WORKSPACES] ✅ Returning ${workspaces?.length || 0} workspaces`)
    return NextResponse.json({ workspaces: workspaces || [] })
  } catch (error) {
    console.error('[WORKSPACES] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
