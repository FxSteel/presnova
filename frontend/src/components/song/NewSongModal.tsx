import { useState, FormEvent } from 'react'
import { Song, createSong } from '../../api/client'

interface NewSongModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (newSong: Song) => void
}

function NewSongModal({ isOpen, onClose, onCreated }: NewSongModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validación
    if (!title.trim()) {
      setValidationError('El título es obligatorio')
      return
    }

    setValidationError(null)
    setError(null)

    try {
      setSaving(true)
      const newSong = await createSong({
        title: title.trim(),
        author: author.trim() || undefined,
        key: key.trim() || undefined,
      })
      
      // Resetear formulario
      setTitle('')
      setAuthor('')
      setKey('')
      setError(null)
      setValidationError(null)
      
      // Llamar callback
      onCreated(newSong)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear canción'
      setError(errorMessage)
      console.error('Error creating song:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setTitle('')
      setAuthor('')
      setKey('')
      setError(null)
      setValidationError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay oscuro */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Nueva Canción</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setValidationError(null)
              }}
              disabled={saving}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              placeholder="Nombre de la canción"
            />
          </div>

          {/* Autor */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-1">
              Autor
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              placeholder="Nombre del autor (opcional)"
            />
          </div>

          {/* Tono */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-300 mb-1">
              Tono
            </label>
            <input
              id="key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              placeholder="Ej: C, G, Dm (opcional)"
            />
          </div>

          {/* Errores */}
          {validationError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200">
              <p className="text-sm">{validationError}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200">
              <p className="text-sm font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creando...' : 'Crear canción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewSongModal

