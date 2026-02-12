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

  // Protect route - redirect if no session
  useEffect(() => {
    if (!loading && !session) {
      console.log('[OPERATOR] No session, redirecting to login')
      router.replace('/auth/login')
    }
  }, [session, loading, router])

  // Hide loading once session is confirmed
  useEffect(() => {
    if (!loading) {
      setPageLoading(false)
    }
  }, [loading])

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

  // Show loading skeleton while workspace is loading
  if (pageLoading && !activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-3 mb-4">
            <div className="w-12 h-12 border-4 border-[#7C6FD8] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 mb-1">Preparando workspace...</p>
          <p className="text-sm text-gray-500">Esto puede tomar unos segundos</p>
        </div>
      </div>
    )
  }

  // No workspace found after loading
  if (!activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-block p-3 bg-red-900/20 border border-red-800 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-300 mb-2 font-medium text-lg">No se pudo cargar el workspace</p>
          <p className="text-sm text-gray-400 mb-4">
            Estamos trabajando en preparar tu espacio. Por favor intenta recargar la página.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-[#7C6FD8] hover:bg-[#6C5FC8] text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Recargar
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="inline-block bg-[#333] hover:bg-[#444] text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Volver a Login
            </button>
          </div>
        </div>
      </div>
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
