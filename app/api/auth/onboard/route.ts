import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECATED: POST /api/auth/onboard
 * 
 * This endpoint is deprecated. Use POST /api/bootstrap instead.
 * 
 * The bootstrap flow has been refactored to:
 * 1. Accept Authorization Bearer token (not user ID in body)
 * 2. Run idempotent operations (upserts with ON CONFLICT)
 * 3. Prevent stack depth limit errors
 * 
 * See app/api/bootstrap/route.ts for the new implementation.
 * See app/providers.tsx signIn() for the correct flow.
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Deprecated endpoint',
      message: 'Please use POST /api/bootstrap instead',
      code: 'DEPRECATED',
    },
    { status: 410 }
  )
}



