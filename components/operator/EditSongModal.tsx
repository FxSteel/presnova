'use client'

import { useState } from 'react'
import { Song } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface EditSongModalProps {
  song: Song
  onClose: () => void
  onSave: (song: Song) => void
}

export default function EditSongModal({
  song,
  onClose,
  onSave,
}: EditSongModalProps) {
  const [formData, setFormData] = useState({
    title: song.title,
    author: song.author || '',
    tonality: song.tonality || '',
    bpm: song.bpm?.toString() || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('songs')
        .update({
          title: formData.title || 'Untitled',
          author: formData.author || null,
          tonality: formData.tonality || null,
          bpm: formData.bpm ? parseInt(formData.bpm) : null,
        })
        .eq('id', song.id)
        .select()
        .single()

      if (error) throw error
      onSave(data)
      onClose()
    } catch (err: any) {
      console.error('Error updating song:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#333] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="font-semibold text-white">Editar Canción</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Autor
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tonalidad
              </label>
              <input
                type="text"
                value={formData.tonality}
                onChange={(e) =>
                  setFormData({ ...formData, tonality: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BPM
              </label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) =>
                  setFormData({ ...formData, bpm: e.target.value })
                }
                className="w-full"
              />
            </div>
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
