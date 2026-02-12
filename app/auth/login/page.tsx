'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Toaster, toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const router = useRouter()
  const { signIn, signUp } = useAuth()

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
        await signUp(email, password, fullName)
        console.log('[LOGIN] Sign up successful')
        toast.success('Cuenta creada. Revisa tu correo para confirmar.')
        // Show confirmation message
        setConfirmationSent(true)
        setEmail('')
        setPassword('')
        setFullName('')
        setIsSignUp(false)
        setLoading(false)
        return
      } else {
        console.log('[LOGIN] Starting sign in with:', email)
        await signIn(email, password)
        console.log('[LOGIN] Sign in successful, user is authenticated')
        
        // Redirect immediately - session is already established by signIn()
        // Bootstrap and workspaces loading happen in background via AuthProvider
        setLoading(false)
        router.push('/operator')
        return
      }
    } catch (err: any) {
      console.error('[LOGIN] Error:', err)
      const errorMessage = err.message || 'Error de autenticación'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show confirmation message
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center space-y-8">
            {/* Title */}
            <h1 className="text-4xl font-bold text-white">
              Email de confirmación enviado
            </h1>

            {/* Check Icon */}
            <div className="flex justify-center">
              <div className="inline-block p-4 bg-green-900/20 border border-green-800 rounded-full">
                <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Subtitle */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                Revisa tu correo electrónico
              </h2>
              
              {/* Description with dynamic email */}
              <p className="text-gray-400 text-sm leading-relaxed">
                Te hemos enviado un enlace de confirmación a <span className="text-[#7C6FD8] font-medium">{email}</span>
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Haz clic en el enlace para confirmar tu correo. Una vez confirmado, podrás iniciar sesión.
              </p>
            </div>

            {/* Back Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmationSent(false)
                  setIsSignUp(false)
                }}
                className="text-sm text-[#7C6FD8] hover:text-[#8b7fef] transition-colors font-medium"
              >
                Volver a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <Toaster position="top-right" theme="dark" />
      <div className="w-full max-w-md">
        <div className="card border-2 border-[#333]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Nova</h1>
            <p className="text-gray-400">Gestor de Canciones</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Field>
                <FieldLabel htmlFor="signup-fullname" className="text-gray-300">
                  Nombre Completo
                </FieldLabel>
                <Input
                  id="signup-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required={isSignUp}
                  disabled={loading}
                  className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                />
                {!error && (
                  <FieldDescription className="text-gray-500">
                    Será usado para personalizar tu workspace.
                  </FieldDescription>
                )}
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="login-email" className="text-gray-300">
                Email
              </FieldLabel>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tu@email.com"
                required
                disabled={loading}
                className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
              />
              {!error && (
                <FieldDescription className="text-gray-500">
                  {isSignUp ? 'Usa un correo válido' : 'Usa el correo con el que te registraste.'}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="login-password" className="text-gray-300">
                Contraseña
              </FieldLabel>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
              />
              {!error && (
                <FieldDescription className="text-gray-500">
                  {isSignUp ? 'Mínimo 8 caracteres.' : 'Ingresa tu contraseña.'}
                </FieldDescription>
              )}
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>
                {loading
                  ? 'Procesando...'
                  : isSignUp
                    ? 'Registrarse'
                    : 'Iniciar Sesión'}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
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
