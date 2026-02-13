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
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      // If no auth header, return 401
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('[API/WORKSPACES] Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API/WORKSPACES] Fetching workspaces for user:', user.id)

    // For now, return empty workspaces list
    // In a real app, you'd query the workspaces table
    const workspaces: Array<{
      id: string
      name: string
      slug: string
      role: string
      created_at?: string
    }> = []
    
    return NextResponse.json({
      workspaces,
      defaultWorkspaceId: null,
    })

  } catch (error) {
    console.error('[API/WORKSPACES] Error:', error)
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

    // Verify token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('[API/WORKSPACES] Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    
    console.log('[API/WORKSPACES] Creating workspace:', name)

    // For now, return a mock workspace
    const workspace = {
      id: 'workspace_' + Math.random().toString(36).substr(2, 9),
      name: name || 'My Workspace',
      slug: (name || 'workspace').toLowerCase().replace(/\s+/g, '-'),
      role: 'owner',
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      workspace,
    })

  } catch (error) {
    console.error('[API/WORKSPACES] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
