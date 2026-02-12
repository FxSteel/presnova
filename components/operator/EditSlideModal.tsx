'use client'

import { useState } from 'react'
import { SongSlide } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface EditSlideModalProps {
  slide: SongSlide
  onClose: () => void
  onSave: (slide: SongSlide) => void
}

const slideTypes = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus', 'outro']

export default function EditSlideModal({
  slide,
  onClose,
  onSave,
}: EditSlideModalProps) {
  const [formData, setFormData] = useState({
    type: slide.type,
    label: slide.label || '',
    content: slide.content,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('song_slides')
        .update({
          type: formData.type,
          label: formData.label || null,
          content: formData.content,
        })
        .eq('id', slide.id)
        .select()
        .single()

      if (error) throw error
      onSave(data)
      onClose()
    } catch (err: any) {
      console.error('Error updating slide:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#333] w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="font-semibold text-white">Editar Diapositiva #{slide.position + 1}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Diapositiva
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full"
              >
                {slideTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Etiqueta (Opcional)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                placeholder="Ej: Estribillo #1"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contenido
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full h-64 p-3 bg-[#2a2a2a] border border-[#333] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#7C6FD8] font-mono text-sm"
              placeholder="Escribe el contenido de la diapositiva aquí..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-[#333]">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
