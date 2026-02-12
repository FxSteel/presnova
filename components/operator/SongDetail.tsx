'use client'

import { useState } from 'react'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { Song, SongSlide } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import EditSongModal from './EditSongModal'
import EditSlideModal from './EditSlideModal'

interface SongDetailProps {
  song: Song
  slides: SongSlide[]
  onSongUpdated: (song: Song) => void
  onSongDeleted: (songId: string) => void
  onSlideCreated: (slide: SongSlide) => void
  onSlideUpdated: (slide: SongSlide) => void
  onSlideDeleted: (slideId: string) => void
  workspaceId: string
}

export default function SongDetail({
  song,
  slides,
  onSongUpdated,
  onSongDeleted,
  onSlideCreated,
  onSlideUpdated,
  onSlideDeleted,
  workspaceId,
}: SongDetailProps) {
  const [showEditSong, setShowEditSong] = useState(false)
  const [showEditSlide, setShowEditSlide] = useState(false)
  const [editingSlide, setEditingSlide] = useState<SongSlide | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [creatingSlide, setCreatingSlide] = useState(false)

  const handleDeleteSong = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta canción?')) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('songs')
        .update({ is_archived: true })
        .eq('id', song.id)

      if (error) throw error
      onSongDeleted(song.id)
    } catch (err: any) {
      console.error('Error deleting song:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddSlide = async () => {
    setCreatingSlide(true)
    try {
      const position = Math.max(...slides.map(s => s.position), -1) + 1
      const { data, error } = await supabase
        .from('song_slides')
        .insert([
          {
            song_id: song.id,
            position,
            type: 'verse',
            label: null,
            content: '',
          },
        ])
        .select()
        .single()

      if (error) throw error
      onSlideCreated(data)
    } catch (err: any) {
      console.error('Error creating slide:', err)
    } finally {
      setCreatingSlide(false)
    }
  }

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('¿Eliminar esta diapositiva?')) return

    try {
      const { error } = await supabase
        .from('song_slides')
        .delete()
        .eq('id', slideId)

      if (error) throw error
      onSlideDeleted(slideId)
    } catch (err: any) {
      console.error('Error deleting slide:', err)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-[#333] flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{song.title}</h2>
          <div className="flex gap-4 text-sm text-gray-400">
            {song.author && <span>por {song.author}</span>}
            {song.tonality && <span>Tonalidad: {song.tonality}</span>}
            {song.bpm && <span>BPM: {song.bpm}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditSong(true)}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <Edit2 size={14} />
            Editar
          </button>
          <button
            onClick={handleDeleteSong}
            disabled={deleting}
            className="btn-secondary btn-sm text-red-400 hover:text-red-300 flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="mb-4">No hay diapositivas</p>
            <button
              onClick={handleAddSlide}
              disabled={creatingSlide}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} />
              Agregar Diapositiva
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Diapositivas ({slides.length})</h3>
              <button
                onClick={handleAddSlide}
                disabled={creatingSlide}
                className="btn-primary btn-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} />
                Nueva
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="card border-2 border-[#333] hover:border-[#7C6FD8] transition-colors cursor-pointer group"
                  onClick={() => {
                    setEditingSlide(slide)
                    setShowEditSlide(true)
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="badge">#{slide.position + 1}</span>
                      <span className="badge capitalize">{slide.type}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSlide(slide.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} className="text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {slide.content || '(vacío)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditSong && (
        <EditSongModal
          song={song}
          onClose={() => setShowEditSong(false)}
          onSave={onSongUpdated}
        />
      )}

      {showEditSlide && editingSlide && (
        <EditSlideModal
          slide={editingSlide}
          onClose={() => {
            setShowEditSlide(false)
            setEditingSlide(null)
          }}
          onSave={onSlideUpdated}
        />
      )}
    </>
  )
}
