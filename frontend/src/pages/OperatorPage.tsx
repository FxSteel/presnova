import { useEffect, useState } from 'react'
import { getSongs, Song, deleteSong } from '../api/client'
import SongList from '../components/song/SongList'
import SongSlidesGrid from '../components/song/SongSlidesGrid'
import SongSlidesEditor from '../components/song/SongSlidesEditor'
import NewSongModal from '../components/song/NewSongModal'
import OutputView from '../components/presentation/OutputView'
import VirtualScreen from '../components/presentation/VirtualScreen'
import { usePresentation } from '../context/PresentationContext'

function OperatorPage() {
  const { setActiveSlide } = usePresentation()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isEditingSlides, setIsEditingSlides] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isNewSongOpen, setIsNewSongOpen] = useState(false)

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSongs()
        // Asegurar que data sea un array
        if (Array.isArray(data)) {
          setSongs(data)
        } else {
          throw new Error('La respuesta de la API no es un array válido')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar canciones'
        setError(errorMessage)
        console.error('Error fetching songs:', err)
        // Asegurar que songs sea siempre un array vacío en caso de error
        setSongs([])
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [])

  const handleDeleteSong = async () => {
    if (!selectedSong) return

    try {
      setIsDeleting(true)
      setError(null)
      await deleteSong(selectedSong.id)
      
      // Remover la canción del estado
      setSongs(songs.filter(s => s.id !== selectedSong.id))
      
      // Limpiar selección
      setSelectedSong(null)
      setShowDeleteConfirm(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar canción'
      setError(errorMessage)
      console.error('Error deleting song:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar con lista de canciones */}
      <div className="w-64 bg-gray-800 rounded-lg p-4 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Canciones</h2>
        </div>
        
        {/* Botón Nueva Canción */}
        <button
          onClick={() => setIsNewSongOpen(true)}
          className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Nueva canción
        </button>
        
        {loading && (
          <div className="text-center py-8 text-gray-400">
            <p>Cargando canciones...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 mb-4">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="flex-1 overflow-y-auto">
            <SongList
              songs={songs}
              onSongSelect={(song: Song) => {
                setSelectedSong(song)
                // Limpiar el slide activo al cambiar de canción
                setActiveSlide(null)
              }}
              selectedSongId={selectedSong?.id}
            />
          </div>
        )}
      </div>

      {/* Panel principal (para slides) */}
      <div className="flex-1 bg-gray-800 rounded-lg p-6 overflow-y-auto">
        {selectedSong ? (
          <div className="h-full flex flex-col">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedSong.title || 'Sin título'}
                </h2>
                {selectedSong.author && (
                  <p className="text-gray-400 mb-1">{selectedSong.author}</p>
                )}
                {selectedSong.key && (
                  <p className="text-gray-500 text-sm">Tono: {selectedSong.key}</p>
                )}
              </div>
              {!isEditingSlides && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingSlides(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar slides
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Eliminar canción
                  </button>
                </div>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-200 font-semibold mb-2">
                  ¿Estás seguro de eliminar esta canción?
                </p>
                <p className="text-red-300 text-sm mb-4">
                  Esta acción no se puede deshacer. Se eliminarán también todas las secciones asociadas.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteSong}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {isEditingSlides ? (
              <SongSlidesEditor
                song={selectedSong}
                onSaved={(updatedSong) => {
                  // Actualizar la canción en el array songs
                  setSongs(songs.map(s => s.id === updatedSong.id ? updatedSong : s))
                  // Actualizar selectedSong
                  setSelectedSong(updatedSong)
                  // Volver al modo vista
                  setIsEditingSlides(false)
                }}
                onCancel={() => {
                  setIsEditingSlides(false)
                }}
              />
            ) : selectedSong.sections && Array.isArray(selectedSong.sections) && selectedSong.sections.length > 0 ? (
              <SongSlidesGrid sections={selectedSong.sections} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-lg">
                  Esta canción aún no tiene slides configurados.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">Selecciona una canción para ver sus slides</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Output Preview */}
      <div className="w-[480px] bg-gray-800 rounded-lg p-4 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Output Preview</h3>
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded animate-pulse">
            LIVE
          </span>
        </div>
        <div className="w-full aspect-video relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-inner">
          <VirtualScreen>
            <OutputView />
          </VirtualScreen>
        </div>
      </div>

      {/* Modal Nueva Canción */}
      <NewSongModal
        isOpen={isNewSongOpen}
        onClose={() => setIsNewSongOpen(false)}
        onCreated={(newSong) => {
          // Agregar la canción nueva al inicio del array
          setSongs([newSong, ...songs])
          // Seleccionar la canción recién creada
          setSelectedSong(newSong)
          // Cerrar el modal
          setIsNewSongOpen(false)
          // Limpiar errores
          setError(null)
        }}
      />
    </div>
  )
}

export default OperatorPage

