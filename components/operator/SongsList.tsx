'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Song } from '@/lib/store'
import { supabase } from '@/lib/supabase'

interface SongsListProps {
  songs: Song[]
  selectedSong: Song | null
  onSelectSong: (song: Song) => void
  onSongCreated: (song: Song) => void
  loading: boolean
  workspaceId: string
}

export default function SongsList({
  songs,
  selectedSong,
  onSelectSong,
  onSongCreated,
  loading,
  workspaceId,
}: SongsListProps) {
  const [showNewSongForm, setShowNewSongForm] = useState(false)
  const [newSongData, setNewSongData] = useState({
    title: '',
    author: '',
    tonality: '',
    bpm: '',
  })
  const [creatingNewSong, setCreatingNewSong] = useState(false)

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workspaceId) {
      console.error('Error creating song: No workspace selected')
      return
    }

    setCreatingNewSong(true)

    try {
      const { data, error } = await supabase.from('songs').insert([
        {
          workspace_id: workspaceId,
          title: newSongData.title || 'Untitled',
          author: newSongData.author || null,
          tonality: newSongData.tonality || null,
          bpm: newSongData.bpm ? parseInt(newSongData.bpm) : null,
          is_archived: false,
        },
      ]).select().single()

      if (error) throw error

      onSongCreated(data)
      setNewSongData({ title: '', author: '', tonality: '', bpm: '' })
      setShowNewSongForm(false)
    } catch (err: any) {
      console.error('Error creating song:', err?.message || err)
    } finally {
      setCreatingNewSong(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold text-white flex-1">Canciones</h2>
          <button
            disabled
            className="px-2 py-1 text-xs bg-[#2a2a2a] text-gray-400 rounded cursor-not-allowed opacity-50"
          >
            Biblias
          </button>
        </div>
        <button
          onClick={() => setShowNewSongForm(!showNewSongForm)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#7C6FD8] hover:bg-[#8b7fef] text-white rounded text-sm transition-colors"
        >
          <Plus size={16} />
          Nueva canción
        </button>
      </div>

      {/* New Song Form */}
      {showNewSongForm && (
        <div className="p-4 bg-[#252525] border-b border-[#333] space-y-3">
          <input
            type="text"
            placeholder="Título"
            value={newSongData.title}
            onChange={(e) =>
              setNewSongData({ ...newSongData, title: e.target.value })
            }
            className="w-full text-sm"
          />
          <input
            type="text"
            placeholder="Autor"
            value={newSongData.author}
            onChange={(e) =>
              setNewSongData({ ...newSongData, author: e.target.value })
            }
            className="w-full text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Tonalidad"
              value={newSongData.tonality}
              onChange={(e) =>
                setNewSongData({ ...newSongData, tonality: e.target.value })
              }
              className="text-sm"
            />
            <input
              type="number"
              placeholder="BPM"
              value={newSongData.bpm}
              onChange={(e) =>
                setNewSongData({ ...newSongData, bpm: e.target.value })
              }
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateSong}
              disabled={creatingNewSong || !newSongData.title}
              className="flex-1 btn-primary text-xs disabled:opacity-50"
            >
              {creatingNewSong ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => setShowNewSongForm(false)}
              className="flex-1 btn-secondary text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Songs List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Cargando...</div>
        ) : songs.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No hay canciones. Crea una nueva para empezar.
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {songs.map((song) => (
              <button
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                  selectedSong?.id === song.id
                    ? 'bg-[#7C6FD8] text-white'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                }`}
              >
                <div className="font-medium truncate">{song.title}</div>
                <div className="text-xs opacity-75 truncate">
                  {[song.author, song.tonality]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
