'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAppStore, User, Workspace, WorkspaceMember } from '@/lib/store'

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
  const [loading, setLoading] = useState(true)

  const storeSetUser = useAppStore((state) => state.setUser)
  const storeSetActiveWorkspace = useAppStore((state) => state.setActiveWorkspace)

  // Initialize session and fetch user data
  useEffect(() => {
    let isMounted = true

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] State changed:', event, session?.user?.id)

        if (isMounted) {
          setSession(session)
        }

        if (session?.user) {
          try {
            // Get auth token for API calls
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            const token = currentSession?.access_token

            // Fetch profile and workspaces in PARALLEL
            const [profileResult, workspacesResult] = await Promise.allSettled([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              token ? fetch('/api/auth/workspaces', {
                headers: { 'Authorization': `Bearer ${token}` },
              }).then(r => r.json()) : Promise.resolve({ workspaces: [] })
            ])

            if (!isMounted) return

            // Handle profile
            if (profileResult.status === 'fulfilled') {
              const profileData = profileResult.value?.data
              if (profileData) {
                setUser(profileData)
                storeSetUser(profileData)
              }
            } else if (profileResult.status === 'rejected') {
              console.error('[AUTH] Profile fetch failed:', profileResult.reason)
            }

            // Handle workspaces
            if (workspacesResult.status === 'fulfilled') {
              const { workspaces } = workspacesResult.value || {}
              if (workspaces && workspaces.length > 0) {
                setWorkspaces(workspaces)
                const owned = workspaces.find((w: Workspace) => w.owner_id === session.user.id) || workspaces[0]
                setActiveWorkspaceState(owned)
                storeSetActiveWorkspace(owned)
              } else {
                setWorkspaces([])
                setActiveWorkspaceState(null)
              }
            } else if (workspacesResult.status === 'rejected') {
              console.error('[AUTH] Workspaces fetch failed:', workspacesResult.reason)
              setWorkspaces([])
              setActiveWorkspaceState(null)
            }
          } catch (error) {
            console.error('[AUTH] Error loading user data:', error)
          } finally {
            if (isMounted) {
              setLoading(false)
            }
          }
        } else {
          // No session
          if (isMounted) {
            setUser(null)
            setWorkspaces([])
            setActiveWorkspaceState(null)
            storeSetUser(null)
            storeSetActiveWorkspace(null)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // 1. Create user via Supabase Auth
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

    // 2. Create workspace and workspace member (onboarding)
    if (data.user) {
      try {
        const response = await fetch('/api/auth/onboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            fullName: fullName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            errorData.details || errorData.error || 'Failed to create workspace'
          )
        }

        const onboardData = await response.json()
        if (!onboardData.success) {
          throw new Error('Workspace creation returned false')
        }
      } catch (onboardError) {
        // Log the error but don't fail signup - user can manually create workspace
        console.error('Onboarding error:', onboardError)
        throw new Error(
          `Account created successfully, but automatic workspace setup failed. Please try again or contact support. Details: ${onboardError instanceof Error ? onboardError.message : 'Unknown error'}`
        )
      }
    }
  }

  const signOut = async () => {
    console.log('Signing out...')
    
    // Clear local state immediately
    setSession(null)
    setUser(null)
    setWorkspaces([])
    setActiveWorkspaceState(null)
    storeSetUser(null)
    storeSetActiveWorkspace(null)
    
    try {
      await supabase.auth.signOut()
      console.log('Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
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
