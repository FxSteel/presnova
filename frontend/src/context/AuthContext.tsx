import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loadMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_ACCESS_TOKEN = 'presnova_access_token'
const STORAGE_REFRESH_TOKEN = 'presnova_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(STORAGE_ACCESS_TOKEN)
  )
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem(STORAGE_REFRESH_TOKEN)
  )
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadMe = async () => {
    const token = accessToken || localStorage.getItem(STORAGE_ACCESS_TOKEN)
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token inválido, limpiar
        setAccessToken(null)
        setRefreshToken(null)
        setUser(null)
        localStorage.removeItem(STORAGE_ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_REFRESH_TOKEN)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
      localStorage.removeItem(STORAGE_ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_REFRESH_TOKEN)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Credenciales incorrectas')
    }

    const data = await response.json()
    const newAccessToken = data.access
    const newRefreshToken = data.refresh

    setAccessToken(newAccessToken)
    setRefreshToken(newRefreshToken)
    localStorage.setItem(STORAGE_ACCESS_TOKEN, newAccessToken)
    localStorage.setItem(STORAGE_REFRESH_TOKEN, newRefreshToken)

    // Cargar información del usuario
    await loadMe()
  }

  const logout = () => {
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_REFRESH_TOKEN)
  }

  useEffect(() => {
    if (accessToken) {
      loadMe()
    } else {
      setIsLoading(false)
    }
  }, [])

  const value: AuthContextType = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: !!accessToken && !!user,
    login,
    logout,
    loadMe,
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Cargando...</p>
    </div>
  }

  return (
    <AuthContext.Provider value={value}>
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

