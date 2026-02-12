'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAppStore, User, Workspace, WorkspaceMember } from '@/lib/store'
import { toast } from 'sonner'

interface AuthContextType {
  session: Session | null
  user: User | null
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  setActiveWorkspace: (workspace: Workspace) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(false)
  const [workspacesLoading, setWorkspacesLoading] = useState(false)
  
  // Track bootstrap state to prevent multiple calls
  const bootstrapInProgressRef = useRef<string | null>(null)
  const bootstrapCompletedRef = useRef<Set<string>>(new Set())

  const storeSetUser = useAppStore((state) => state.setUser)
  const storeSetActiveWorkspace = useAppStore((state) => state.setActiveWorkspace)

  // Initialize session and fetch user data
  useEffect(() => {
    let isMounted = true

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          console.log('[AUTH] User signed out')
          if (isMounted) {
            setSession(null)
            setUser(null)
            setWorkspaces([])
            setActiveWorkspaceState(null)
            storeSetUser(null)
            storeSetActiveWorkspace(null)
            bootstrapInProgressRef.current = null
          }
          return
        }

        if (session?.user && isMounted) {
          console.log('[AUTH] Session established for user:', session.user.id)
          setSession(session)

          // Load profile
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (isMounted && profileData) {
              setUser(profileData)
              storeSetUser(profileData)
            }
          } catch (error) {
            console.error('[AUTH] Error loading profile:', error)
          }
        }
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [storeSetUser, storeSetActiveWorkspace])

  // Load workspaces after session is established
  useEffect(() => {
    if (!session?.user) return

    let isMounted = true

    const loadWorkspaces = async () => {
      try {
        setWorkspacesLoading(true)
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const token = currentSession?.access_token

        if (!token || !isMounted) return

        const response = await fetch('/api/auth/workspaces', {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(20000), // 20 second timeout
        })

        if (!response.ok) {
          console.error('[AUTH] Failed to load workspaces:', response.status)
          if (isMounted) {
            setWorkspacesLoading(false)
          }
          return
        }

        if (!isMounted) return

        const { workspaces } = await response.json()
        console.log('[AUTH] Workspaces response:', workspaces?.length || 0)
        
        if (workspaces && workspaces.length > 0) {
          setWorkspaces(workspaces)
          const owned = workspaces.find((w: Workspace) => w.owner_id === session.user.id) || workspaces[0]
          setActiveWorkspaceState(owned)
          storeSetActiveWorkspace(owned)
          console.log('[AUTH] ✅ Workspaces loaded successfully:', workspaces.length)
        } else {
          console.warn('[AUTH] ⚠️ No workspaces returned from API')
          setWorkspaces([])
        }
      } catch (error) {
        console.error('[AUTH] Error loading workspaces:', error)
        if (isMounted) {
          setWorkspaces([])
        }
      } finally {
        if (isMounted) {
          setWorkspacesLoading(false)
        }
      }
    }

    loadWorkspaces()

    return () => {
      isMounted = false
    }
  }, [session?.user, storeSetActiveWorkspace])

  const signIn = async (email: string, password: string) => {
    console.log('[AUTH] Sign in attempt for:', email)

    try {
      setLoading(true)
      
      // Sign in
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[AUTH] Sign in failed:', error.message)
        throw error
      }

      if (!data.user?.id) {
        throw new Error('Sign in succeeded but no user returned')
      }

      const userId = data.user.id

      // Prevent multiple bootstrap calls for same user
      if (bootstrapInProgressRef.current === userId) {
        console.log('[AUTH] Bootstrap already in progress for:', userId)
        return
      }

      // If already completed for this user in this session, skip bootstrap
      if (bootstrapCompletedRef.current.has(userId)) {
        console.log('[AUTH] Bootstrap already completed for:', userId)
        return
      }

      bootstrapInProgressRef.current = userId
      console.log('[AUTH] Sign in successful, user:', userId)

      // Bootstrap workspace (server-side) with retry logic
      let bootstrapSuccess = false
      let retries = 0
      const maxRetries = 3

      while (!bootstrapSuccess && retries < maxRetries) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          const token = currentSession?.access_token

          if (!token) {
            throw new Error('No access token after sign in')
          }

          console.log(`[AUTH] Calling bootstrap endpoint (attempt ${retries + 1}/${maxRetries})...`)
          const bootstrapResponse = await fetch('/api/bootstrap', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(20000), // 20 second timeout
          })

          if (!bootstrapResponse.ok) {
            const errorData = await bootstrapResponse.json()
            throw new Error(
              errorData.details || errorData.error || `Bootstrap failed (${bootstrapResponse.status})`
            )
          }

          const bootstrapData = await bootstrapResponse.json()
          console.log('[AUTH] ✅ Bootstrap success:', bootstrapData.workspace_id)
          bootstrapSuccess = true
          bootstrapCompletedRef.current.add(userId)

          // Wait briefly for workspaces endpoint to be updated
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (bootstrapError) {
          retries++
          const errorMsg = bootstrapError instanceof Error ? bootstrapError.message : String(bootstrapError)
          console.warn(`[AUTH] Bootstrap attempt ${retries} failed:`, errorMsg)

          if (retries < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 500 * retries))
          }
        }
      }

      if (!bootstrapSuccess) {
        console.warn('[AUTH] Bootstrap failed after retries, workspaces will load from API')
        // Don't fail login - workspace might already exist, or will be loaded by workspaces endpoint
      }
    } catch (err) {
      console.error('[AUTH] Sign in error:', err instanceof Error ? err.message : err)
      throw err
    } finally {
      bootstrapInProgressRef.current = null
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Only create auth account
    // Workspace will be created on first login (post-email confirmation)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    console.log('[AUTH] Signup successful, user needs to confirm email')
  }

  const signOut = async () => {
    console.log('[AUTH] Signing out...')
    
    // Clear local state immediately
    setSession(null)
    setUser(null)
    setWorkspaces([])
    setActiveWorkspaceState(null)
    storeSetUser(null)
    storeSetActiveWorkspace(null)
    
    // Reset bootstrap tracking
    bootstrapInProgressRef.current = null
    bootstrapCompletedRef.current.clear()
    
    try {
      await supabase.auth.signOut()
      console.log('[AUTH] Sign out successful')
    } catch (error) {
      console.error('[AUTH] Sign out error:', error)
    }
  }

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace)
    storeSetActiveWorkspace(workspace)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        workspaces,
        activeWorkspace,
        loading,
        signIn,
        signUp,
        signOut,
        setActiveWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
