'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
  const supabase = createClient()

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
        const { error: signInError } = await supabase.auth.signInWithPassword({
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

        console.log('[LOGIN] Sign in successful')
        toast.success('¡Bienvenido!')
        
        router.push('/')
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
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-gray-400">
            {isSignUp
              ? 'Crea una nueva cuenta para comenzar'
              : 'Ingresa tus credenciales para acceder'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Field>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7C6FD8] hover:bg-[#6C5FC8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="ml-2 text-[#7C6FD8] hover:underline font-medium"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
