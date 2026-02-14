'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/browser'
import { useWorkspace } from '@/lib/workspace-provider'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { setWorkspace } = useWorkspace()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error('El nombre completo es requerido')
          setLoading(false)
          return
        }

        console.log('[LOGIN] Starting sign up...')
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (signUpError) {
          console.error('[LOGIN] Sign up error:', signUpError)
          setError(signUpError.message)
          toast.error(signUpError.message)
          setLoading(false)
          return
        }

        console.log('[LOGIN] Sign up successful')
        toast.success('Cuenta creada. Revisa tu correo para confirmar.')
        setEmail('')
        setPassword('')
        setFullName('')
        setIsSignUp(false)
        setLoading(false)
        return
      } else {
        console.log('[LOGIN] Starting sign in with:', email)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          console.error('[LOGIN] Sign in error:', signInError)
          setError(signInError.message)
          toast.error(signInError.message)
          setLoading(false)
          return
        }

        if (!authData?.session?.access_token) {
          console.error('[LOGIN] No access token in response')
          setError('Authentication failed: no token')
          toast.error('Authentication failed')
          setLoading(false)
          return
        }

        console.log('[LOGIN] Sign in successful, loading workspace...')
        const toastId = toast.loading('Cargando datos del workspace...')

        // Step 1: Bootstrap (ensure profile + workspace exist)
        try {
          const bootstrapResponse = await fetch('/api/bootstrap', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authData.session.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (bootstrapResponse.ok) {
            console.log('[LOGIN] ✅ Bootstrap complete')
          } else {
            console.warn('[LOGIN] Bootstrap returned non-OK, continuing...')
          }
        } catch (err) {
          console.warn('[LOGIN] Bootstrap error, continuing...', err)
        }

        // Step 2: Load workspace from API
        const wsResponse = await fetch('/api/workspaces/active', {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!wsResponse.ok) {
          const errorData = await wsResponse.json().catch(() => ({}))
          toast.dismiss(toastId)
          
          if (errorData.code === 'NO_WORKSPACE') {
            setError('Tu cuenta no tiene workspace asociado. Contacta soporte.')
            toast.error('No se encontró workspace')
          } else {
            setError('Error cargando workspace')
            toast.error('Error cargando workspace')
          }
          setLoading(false)
          return
        }

        const wsData = await wsResponse.json()
        const workspace = wsData.workspace
        console.log('[LOGIN] ✅ Workspace loaded:', workspace.name)

        // Save workspace to global state
        setWorkspace(workspace)

        // Navigate to dashboard
        toast.dismiss(toastId)
        toast.success('¡Bienvenido!')
        router.push('/operator')
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      console.error('[LOGIN] Error:', message)
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isSignUp
                ? 'Crea una nueva cuenta para comenzar'
                : 'Ingresa tus credenciales para acceder'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Field>
                <FieldLabel htmlFor="fullName">Nombre completo</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-xs text-[#7C6FD8] hover:underline"
                    disabled
                  >
                    ¿Olvidaste?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C6FD8] hover:bg-[#6C5FC8] disabled:bg-[#7C6FD8]/50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1a1a1a] text-gray-400">o</span>
            </div>
          </div>

          {/* Toggle Link */}
          <div className="text-center text-sm">
            <span className="text-gray-400">
              {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="ml-1.5 text-[#7C6FD8] hover:underline font-medium"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
