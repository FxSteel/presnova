const API_BASE_URL = 'http://127.0.0.1:8000/api'

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
    const response = await fetch(`${API_BASE_URL}/songs/`)
    
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
    
    const response = await fetch(`${API_BASE_URL}/songs/${song.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/songs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/songs/${songId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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

