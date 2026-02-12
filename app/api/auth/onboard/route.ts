import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role (can bypass RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY not set. Workspace onboarding will not work. Set it in .env.local'
  )
}

const supabaseAdmin = serviceRoleKey
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error: 'Workspace setup not configured',
          details:
            'SUPABASE_SERVICE_ROLE_KEY is not set. Please configure it in server environment.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { userId, email, fullName } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email' },
        { status: 400 }
      )
    }

    // 1. Create workspace
    const workspaceName = fullName ? `${fullName}'s Workspace` : `Workspace`
    const workspaceSlug = email.split('@')[0].toLowerCase()

    const { data: workspaceData, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: workspaceSlug,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (workspaceError) {
      console.error('Workspace creation error:', workspaceError)
      return NextResponse.json(
        { error: 'Failed to create workspace', details: workspaceError.message },
        { status: 500 }
      )
    }

    if (!workspaceData) {
      return NextResponse.json(
        { error: 'Workspace created but no data returned' },
        { status: 500 }
      )
    }

    // 2. Check if member already exists
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceData.id)
      .eq('user_id', userId)
      .single()

    // If member doesn't exist, create it
    if (!existingMember) {
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString(),
        })

      if (memberError) {
        console.error('Workspace member creation error:', memberError)
        // Try to rollback workspace creation
        await supabaseAdmin.from('workspaces').delete().eq('id', workspaceData.id)
        return NextResponse.json(
          { error: 'Failed to create workspace membership', details: memberError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        workspace: workspaceData,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Onboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

