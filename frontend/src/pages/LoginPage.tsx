import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(username, password)
      navigate('/operator')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-surface-1 rounded-lg p-8 border border-subtle">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">PresNova</h1>
          <p className="text-secondary text-center mb-6">Iniciar sesión</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary mb-1">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-surface-2 text-white rounded-lg border border-subtle focus:outline-none focus:border-brand-primary disabled:bg-surface-2 disabled:cursor-not-allowed transition-colors"
                placeholder="Nombre de usuario"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-surface-2 text-white rounded-lg border border-subtle focus:outline-none focus:border-brand-primary disabled:bg-surface-2 disabled:cursor-not-allowed transition-colors"
                placeholder="Contraseña"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-status-error/20 border border-status-error rounded-lg p-3 text-status-error">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-brand-primary text-bg-app rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

