'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { useAppStore, Song, SongSlide } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import SongsList from '@/components/operator/SongsList'
import SongDetail from '@/components/operator/SongDetail'
import OutputPreview from '@/components/operator/OutputPreview'

export default function OperatorPage() {
  const { activeWorkspace, user, session, loading } = useAuth()
  const router = useRouter()
  const { selectedSong, setSelectedSong } = useAppStore()
  const [songs, setSongs] = useState<Song[]>([])
  const [slides, setSlides] = useState<SongSlide[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')

  // Protect route
  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth/login')
    } else if (!loading) {
      setPageLoading(false)
    }
  }, [session, loading, router])

  useEffect(() => {
    if (!activeWorkspace) return

    const fetchSongs = async () => {
      try {
        setPageLoading(true)
        const { data, error: err } = await supabase
          .from('songs')
          .select('*')
          .eq('workspace_id', activeWorkspace.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false })

        if (err) throw err
        setSongs(data || [])
      } catch (err: any) {
        setError(err.message || 'Error loading songs')
      } finally {
        setPageLoading(false)
      }
    }

    fetchSongs()
  }, [activeWorkspace])

  useEffect(() => {
    if (!selectedSong) {
      setSlides([])
      return
    }

    const fetchSlides = async () => {
      try {
        const { data, error: err } = await supabase
          .from('song_slides')
          .select('*')
          .eq('song_id', selectedSong.id)
          .order('position', { ascending: true })

        if (err) throw err
        setSlides(data || [])
      } catch (err: any) {
        console.error('Error loading slides:', err)
      }
    }

    fetchSlides()
  }, [selectedSong])

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song)
  }

  const handleSongCreated = (newSong: Song) => {
    setSongs([newSong, ...songs])
    setSelectedSong(newSong)
  }

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs(songs.map((s) => (s.id === updatedSong.id ? updatedSong : s)))
    if (selectedSong?.id === updatedSong.id) {
      setSelectedSong(updatedSong)
    }
  }

  const handleSongDeleted = (songId: string) => {
    setSongs(songs.filter((s) => s.id !== songId))
    if (selectedSong?.id === songId) {
      setSelectedSong(null)
    }
  }

  const handleSlideCreated = (newSlide: SongSlide) => {
    setSlides([...slides, newSlide].sort((a, b) => a.position - b.position))
  }

  const handleSlideUpdated = (updatedSlide: SongSlide) => {
    setSlides(
      slides
        .map((s) => (s.id === updatedSlide.id ? updatedSlide : s))
        .sort((a, b) => a.position - b.position)
    )
  }

  const handleSlideDeleted = (slideId: string) => {
    setSlides(slides.filter((s) => s.id !== slideId))
  }

  if (!session) return null

  if (!activeWorkspace) {
    return (
      <>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">No hay espacio de trabajo seleccionado</p>
            <p className="text-sm text-gray-500">Selecciona uno en el menú lateral</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* This component is wrapped by layout-app through app/operator/layout.tsx */}
      <div className="flex h-full gap-4 p-4">
      {/* Column A: Songs List */}
      <div className="w-80 bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden flex flex-col">
        <SongsList
          songs={songs}
          selectedSong={selectedSong}
          onSelectSong={handleSongSelect}
          onSongCreated={handleSongCreated}
          loading={pageLoading}
          workspaceId={activeWorkspace?.id || ''}
        />
      </div>

      {/* Column B: Song Content */}
      <div className="flex-1 bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden flex flex-col">
        {selectedSong ? (
          <SongDetail
            song={selectedSong}
            slides={slides}
            onSongUpdated={handleSongUpdated}
            onSongDeleted={handleSongDeleted}
            onSlideCreated={handleSlideCreated}
            onSlideUpdated={handleSlideUpdated}
            onSlideDeleted={handleSlideDeleted}
            workspaceId={activeWorkspace?.id || ''}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Selecciona una canción para ver detalles
          </div>
        )}
      </div>

      {/* Column C: Output Preview */}
      <div className="w-96 bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden flex flex-col">
        {selectedSong ? (
          <OutputPreview song={selectedSong} slides={slides} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Selecciona una canción para ver la salida
          </div>
        )}
      </div>
    </div>
    </>
  )
}
