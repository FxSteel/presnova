'use client'

import { useState } from 'react'
import { Song, SongSlide } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { Play, Pause } from 'lucide-react'

interface OutputPreviewProps {
  song: Song
  slides: SongSlide[]
}

export default function OutputPreview({ song, slides }: OutputPreviewProps) {
  const { logoMode, setLogoMode } = useAppStore()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentSlide = slides[currentSlideIndex] || null

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-3 border-b border-[#333] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Salida en Vivo</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-400">Logo:</span>
              <button
                onClick={() => setLogoMode(logoMode === 'ON' ? 'OFF' : 'ON')}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  logoMode === 'ON'
                    ? 'bg-[#7C6FD8] text-white'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                }`}
              >
                {logoMode}
              </button>
            </div>
          </div>
        </div>

        {/* Slide counter */}
        {slides.length > 0 && (
          <div className="text-xs text-gray-400">
            Diapositiva {currentSlideIndex + 1} de {slides.length}
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 relative">
        {slides.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>No hay diapositivas</p>
          </div>
        ) : logoMode === 'ON' ? (
          <div className="text-center">
            <div className="text-4xl text-[#7C6FD8]">🎵</div>
            <p className="text-gray-300 mt-4">{song.title}</p>
          </div>
        ) : (
          <div className="w-full h-full p-6 overflow-auto">
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">
                {currentSlide?.type} {currentSlide?.label && `- ${currentSlide.label}`}
              </p>
              <div className="text-white whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {currentSlide?.content || ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {slides.length > 0 && (
        <div className="p-3 border-t border-[#333] flex gap-2">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="flex-1 btn-secondary btn-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex-1 btn-secondary btn-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
