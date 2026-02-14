'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/browser'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AUTH-PROVIDER] Error getting session:', error)
        } else if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          if (initialSession?.user?.id) {
            console.log('[AUTH] session ok - user:', initialSession.user.id)
          }
        }
      } catch (err) {
        console.error('[AUTH-PROVIDER] Initialization error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        if (!isMounted) return

        console.log('[AUTH-PROVIDER] Auth state changed:', event)

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (event === 'SIGNED_IN') {
          console.log('[AUTH] session ok - user:', currentSession?.user?.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('[AUTH-PROVIDER] User signed out')
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[AUTH-PROVIDER] Sign out error:', error)
        throw error
      }
    } catch (err) {
      console.error('[AUTH-PROVIDER] Sign out failed:', err)
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}