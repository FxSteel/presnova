import { useState } from 'react'
import { Song, SongSection, updateSong } from '../../api/client'

interface SongSlidesEditorProps {
  song: Song
  onSaved: (updatedSong: Song) => void
  onCancel: () => void
}

const SECTION_TYPES = [
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'prechorus', label: 'Pre-chorus' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'tag', label: 'Tag' },
  { value: 'other', label: 'Other' },
]

function SongSlidesEditor({ song, onSaved, onCancel }: SongSlidesEditorProps) {
  const [sections, setSections] = useState<SongSection[]>(
    song.sections && song.sections.length > 0
      ? [...song.sections]
      : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSectionChange = (index: number, field: keyof SongSection, value: string | number) => {
    const updated = [...sections]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setSections(updated)
  }

  const handleAddSection = () => {
    const newOrder = sections.length > 0 
      ? Math.max(...sections.map(s => s.order)) + 1 
      : 1
    
    const newSection: SongSection = {
      id: 0, // ID temporal, se asignará en el backend
      section_type: 'verse',
      order: newOrder,
      text: '',
    }
    setSections([...sections, newSection])
  }

  const handleRemoveSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index)
    // Reordenar los orders para que sean consecutivos
    const reordered = updated.map((section, i) => ({
      ...section,
      order: i + 1,
    }))
    setSections(reordered)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Validar que todas las secciones tengan texto
      const invalidSections = sections.filter(s => !s.text.trim())
      if (invalidSections.length > 0) {
        setError('Todas las secciones deben tener texto')
        setSaving(false)
        return
      }
      
      // Crear objeto canción actualizado con las secciones
      const updatedSongData: Song = {
        ...song,
        sections: sections,
      }
      
      const updatedSong = await updateSong(updatedSongData)
      onSaved(updatedSong)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar los cambios'
      setError(errorMessage)
      console.error('Error saving sections:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Editar Slides</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay slides. Haz clic en "+ Añadir slide" para agregar uno.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-slate-700 rounded-lg p-4 border border-slate-600"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={section.section_type}
                    onChange={(e) => handleSectionChange(index, 'section_type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                  >
                    {SECTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={section.order}
                    onChange={(e) => handleSectionChange(index, 'order', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-6 flex items-end">
                  <button
                    onClick={() => handleRemoveSection(index)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Texto
                </label>
                <textarea
                  value={section.text}
                  onChange={(e) => handleSectionChange(index, 'text', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 whitespace-pre-wrap resize-y"
                  placeholder="Escribe el texto de la sección..."
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={handleAddSection}
          disabled={saving}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          + Añadir slide
        </button>
      </div>
    </div>
  )
}

export default SongSlidesEditor

