'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingStep('')

    try {
      if (isSignUp) {
        if (!fullName) {
          setError('El nombre completo es requerido')
          setLoading(false)
          return
        }
        setLoadingStep('Creando cuenta...')
        console.log('[LOGIN] Starting sign up...')
        await signUp(email, password, fullName)
        console.log('[LOGIN] Sign up completed, setting up workspace...')
        setLoadingStep('Configurando workspace...')
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        setLoadingStep('Iniciando sesión...')
        console.log('[LOGIN] Starting sign in with:', email)
        await signIn(email, password)
        console.log('[LOGIN] Sign in completed, waiting for sync...')
        // Give auth state change listener time to update session
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      console.log('[LOGIN] Redirecting to operator...')
      router.push('/operator')
    } catch (err: any) {
      console.error('[LOGIN] Error:', err)
      setError(err.message || 'Error de autenticación')
      setLoadingStep('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card border-2 border-[#333]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Nova</h1>
            <p className="text-gray-400">Gestor de Canciones</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {loadingStep && (
            <div className="mb-6 p-3 bg-blue-900/20 border border-blue-800 rounded text-blue-300 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              {loadingStep}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full"
                  required={isSignUp}
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading
                ? 'Procesando...'
                : isSignUp
                  ? 'Registrarse'
                  : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setLoadingStep('')
                setFullName('')
              }}
              disabled={loading}
              className="text-sm text-purple-light hover:text-[#8b7fef] transition-colors disabled:opacity-50"
            >
              {isSignUp
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
