const API_BASE_URL = 'http://127.0.0.1:8000/api'

// Helper para obtener tokens del localStorage
const getAccessToken = (): string | null => {
  return localStorage.getItem('presnova_access_token')
}

const getRefreshToken = (): string | null => {
  return localStorage.getItem('presnova_refresh_token')
}

const setAccessToken = (token: string): void => {
  localStorage.setItem('presnova_access_token', token)
}

const setRefreshToken = (token: string): void => {
  localStorage.setItem('presnova_refresh_token', token)
}

const clearTokens = (): void => {
  localStorage.removeItem('presnova_access_token')
  localStorage.removeItem('presnova_refresh_token')
}

// Helper para hacer refresh del token
const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken()
  if (!refresh) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = await response.json()
    const newAccessToken = data.access
    setAccessToken(newAccessToken)
    return newAccessToken
  } catch (error) {
    clearTokens()
    return null
  }
}

// Helper para hacer fetch con auth y refresh automático
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const accessToken = getAccessToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...options.headers,
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  // Si recibimos 401, intentar refresh
  if (response.status === 401 && accessToken) {
    const newAccessToken = await refreshAccessToken()
    
    if (newAccessToken) {
      // Reintentar la request con el nuevo token
      headers['Authorization'] = `Bearer ${newAccessToken}`
      response = await fetch(url, {
        ...options,
        headers,
      })
    } else {
      // Si refresh falla, disparar logout
      clearTokens()
      window.location.href = '/login'
    }
  }

  return response
}

// Funciones de autenticación
export async function login(username: string, password: string): Promise<{ access: string; refresh: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
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

  return response.json()
}

export async function getMe(): Promise<{ id: number; username: string; email: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me/`)
  
  if (!response.ok) {
    throw new Error(`Error al obtener usuario: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export interface SongSection {
  id?: number
  section_type: string
  order: number
  text: string
}

export interface Song {
  id: number
  title: string
  author: string
  key: string
  sections?: SongSection[]
}

export async function getSongs(): Promise<Song[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/songs/`)
    
    if (!response.ok) {
      throw new Error(`Error al obtener canciones: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // DRF con paginación devuelve {results: [...]}, sin paginación devuelve [...]
    let songs: Song[] = []
    if (data && Array.isArray(data.results)) {
      songs = data.results
    } else if (Array.isArray(data)) {
      songs = data
    } else {
      throw new Error('Formato de respuesta inesperado de la API')
    }
    
    // Asegurar que cada canción tenga el campo sections parseado correctamente
    return songs.map((song: any) => ({
      id: song.id,
      title: song.title || '',
      author: song.author || '',
      key: song.key || '',
      sections: Array.isArray(song.sections) ? song.sections : undefined,
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de red al obtener canciones')
  }
}

// Set the global presentation state (active section)
export async function setPresentationState(sectionId: number): Promise<any> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/presentation/state/`, {
      method: 'POST',
      body: JSON.stringify({ section_id: sectionId }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Error setting presentation state: ${response.status} ${response.statusText} ${errorText}`)
    }

    return response.json()
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Network error setting presentation state')
  }
}

export async function updateSong(song: Song): Promise<Song> {
  try {
    const payload = {
      title: song.title || '',
      author: song.author || '',
      key: song.key || '',
      sections: (song.sections || []).map(section => ({
        id: section.id || undefined,
        section_type: section.section_type,
        order: section.order,
        text: section.text,
      })),
    }
    
    const response = await fetchWithAuth(`${API_BASE_URL}/songs/${song.id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      throw new Error(`Error al actualizar canción: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      id: data.id,
      title: data.title || '',
      author: data.author || '',
      key: data.key || '',
      sections: Array.isArray(data.sections) ? data.sections : undefined,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de red al actualizar canción')
  }
}

export async function createSong(payload: { title: string; author?: string; key?: string }): Promise<Song> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/songs/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      // Intentar leer el JSON del error si está disponible
      let errorMessage = `Error al crear canción: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.title && Array.isArray(errorData.title)) {
          errorMessage = errorData.title.join(', ')
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    
    return {
      id: data.id,
      title: data.title || '',
      author: data.author || '',
      key: data.key || '',
      sections: Array.isArray(data.sections) ? data.sections : [],
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de red al crear canción')
  }
}

export async function deleteSong(songId: number): Promise<void> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/songs/${songId}/`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Error al eliminar canción: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de red al eliminar canción')
  }
}

