/**
 * Singleton Supabase client for browser only.
 * ALWAYS import from here, never use createClient() elsewhere.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create once and reuse
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseKey!)
  }
  return supabaseInstance
}

// Default export for convenience
export default getSupabaseClient()
