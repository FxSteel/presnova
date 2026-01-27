import { useEffect, useState, useRef } from 'react'
import { getSongs, Song, deleteSong, fetchWithAuth } from '../api/client'
import SongList from '../components/song/SongList'
import SongSlidesGrid from '../components/song/SongSlidesGrid'
import SongSlidesEditor from '../components/song/SongSlidesEditor'
import NewSongModal from '../components/song/NewSongModal'
import OutputView from '../components/presentation/OutputView'
import VirtualScreen from '../components/presentation/VirtualScreen'
import { usePresentation } from '../context/PresentationContext'

function OperatorPage() {
  const { setActiveSlide } = usePresentation()
  const [leftTab, setLeftTab] = useState<'songs' | 'bibles'>('songs')
  const [bibleQuery, setBibleQuery] = useState<string>('')
  const [bibleVersion, setBibleVersion] = useState<string>('RVR1960')
  const [bibleSearchResult, setBibleSearchResult] = useState<any | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isEditingSlides, setIsEditingSlides] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isNewSongOpen, setIsNewSongOpen] = useState(false)
  // Projection window refs
  const outputWinRef = useRef<Window | null>(null)
  const stageWinRef = useRef<Window | null>(null)
  const [screensList, setScreensList] = useState<any[]>([])
  const [showLogo, setShowLogo] = useState(false)

  useEffect(() => {
    // Sync showLogo to localStorage
    localStorage.setItem('presnova.output.showLogo', showLogo ? 'true' : 'false')
    // Dispatch custom event for components listening in the same window
    window.dispatchEvent(new CustomEvent('logoToggleChange'))
  }, [showLogo])

  useEffect(() => {
    // detect available screens (best-effort)
    const detectScreens = async () => {
      try {
        // Modern API (experimental)
        const gd = (window as any).getScreenDetails
        if (typeof gd === 'function') {
          const details = await gd()
          const list = (details.screens || []).map((s: any, idx: number) => ({
            id: s.id ?? `s-${idx}`,
            left: s.left ?? s.availLeft ?? 0,
            top: s.top ?? s.availTop ?? 0,
            width: s.width ?? s.availWidth ?? window.screen.width,
            height: s.height ?? s.availHeight ?? window.screen.height,
            label: s.label || `Pantalla ${idx + 1}`,
          }))
          if (list.length > 0) {
            setScreensList(list)
            return
          }
        }
      } catch (err) {
        // ignore
      }

      // Fallback to the primary screen only
      setScreensList([{
        id: 'primary',
        left: (window.screenLeft as number) || 0,
        top: (window.screenTop as number) || 0,
        width: window.screen.width,
        height: window.screen.height,
        label: 'Principal',
      }])
    }

    detectScreens()
  }, [])

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

  // Open or reuse projection window
  const openProjection = (kind: 'output' | 'stage', screen: any) => {
    try {
      const url = `${window.location.origin}/${kind}`
      const name = `presnova-${kind}`
      const features = `left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height},toolbar=0,location=0,menubar=0,scrollbars=0,status=0,resizable=1`

      const ref = kind === 'output' ? outputWinRef : stageWinRef

      // Reuse existing window if still open
      if (ref.current && !ref.current.closed) {
        try {
          ref.current.focus()
          // Try to move and resize (may be blocked by browser)
          if (typeof ref.current.moveTo === 'function') {
            ref.current.moveTo(screen.left, screen.top)
            ref.current.resizeTo(screen.width, screen.height)
          }
          // Navigate if URL differs
          if (ref.current.location && ref.current.location.href !== url) {
            ref.current.location.href = url
          }
          return
        } catch (err) {
          // Fallthrough to open new window
        }
      }

      const newWin = window.open(url, name, features)
      if (newWin) {
        ref.current = newWin
        console.log(`[Operator] opened projection window (${kind})`, { url, name })
        // Periodically check if window was closed
        const interval = setInterval(() => {
          if (!ref.current || ref.current.closed) {
            clearInterval(interval)
            if (kind === 'output') outputWinRef.current = null
            else stageWinRef.current = null
          }
        }, 1000)
      } else {
        alert('No se pudo abrir la ventana de proyección. Revisa bloqueadores de ventanas emergentes.')
      }
    } catch (err) {
      console.error('openProjection error', err)
    }
  }

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar con lista de canciones / biblias */}
      <div className="w-64 bg-surface-1 rounded-lg p-4 overflow-y-auto flex flex-col">
        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setLeftTab('songs')}
            className={`px-3 py-1 rounded-l-md text-sm font-medium ${leftTab === 'songs' ? 'bg-surface-2 text-white' : 'bg-surface-1 text-secondary hover:bg-surface-2'}`}
          >
            Canciones
          </button>
          <button
            onClick={() => setLeftTab('bibles')}
            className={`px-3 py-1 rounded-r-md text-sm font-medium ${leftTab === 'bibles' ? 'bg-surface-2 text-white' : 'bg-surface-1 text-secondary hover:bg-surface-2'}`}
          >
            Biblias
          </button>
        </div>

        {leftTab === 'songs' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Canciones</h2>
            </div>
            {/* Botón Nueva Canción */}
            <button
              onClick={() => setIsNewSongOpen(true)}
              className="w-full mb-4 px-4 py-2 bg-brand-primary text-bg-app rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              + Nueva canción
            </button>

            {loading && (
              <div className="text-center py-8 text-muted">
                <p>Cargando canciones...</p>
              </div>
            )}

            {error && (
              <div className="bg-status-error/20 border border-status-error rounded-lg p-4 text-status-error mb-4">
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
          </>
        ) : (
          // Bibles tab - LOCKED/PLACEHOLDER
          <div className="h-full flex flex-col items-center justify-center opacity-50 pointer-events-none cursor-not-allowed">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted mb-2">Biblias</p>
              <p className="text-muted text-lg">Próximamente (feature adicional)</p>
              <p className="text-muted text-sm mt-4">Esta funcionalidad estará disponible en futuras versiones</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel principal (para slides) */}
      <div className="flex-1 bg-surface-1 rounded-lg p-6 overflow-y-auto">
        {leftTab === 'bibles' ? (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Resultado de búsqueda</h2>
            </div>

            {bibleSearchResult ? (
              bibleSearchResult.error ? (
                <div className="text-status-error">{bibleSearchResult.error}</div>
              ) : (
                <div className="bg-surface-2 p-4 rounded text-white overflow-auto">
                  <h3 className="font-semibold mb-2">{bibleSearchResult.reference} — {bibleSearchResult.version}</h3>
                  <pre className="whitespace-pre-wrap">{bibleSearchResult.text}</pre>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted">Realiza una búsqueda para ver resultados</p>
              </div>
            )}
          </div>
        ) : (
          (selectedSong ? (
            <div className="h-full flex flex-col">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedSong.title || 'Sin título'}
                  </h2>
                  {selectedSong.author && (
                    <p className="text-secondary mb-1">{selectedSong.author}</p>
                  )}
                  {selectedSong.key && (
                    <p className="text-muted text-sm">Tono: {selectedSong.key}</p>
                  )}
                </div>
                {!isEditingSlides && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingSlides(true)}
                      className="px-4 py-2 bg-brand-primary text-bg-app rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Editar slides
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-status-error text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Eliminar canción
                    </button>
                  </div>
                )}
              </div>

              {showDeleteConfirm && (
                <div className="mb-6 bg-status-error/20 border border-status-error rounded-lg p-4">
                  <p className="text-status-error font-semibold mb-2">
                    ¿Estás seguro de eliminar esta canción?
                  </p>
                  <p className="text-status-error text-sm mb-4">
                    Esta acción no se puede deshacer. Se eliminarán también todas las secciones asociadas.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteSong}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-status-error text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-surface-2 text-white rounded-lg hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <p className="text-muted text-lg">
                    Esta canción aún no tiene slides configurados.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted">
                <p className="text-lg">Selecciona una canción para ver sus slides</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right column: Output Preview + Projection controls */}
      <div className="w-[480px] bg-surface-1 rounded-lg p-4 flex flex-col gap-4">
        <div className="mb-0 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Output Preview</h3>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-status-error text-white text-xs font-semibold rounded animate-pulse">
              LIVE
            </span>
            <button
              onClick={() => setShowLogo(!showLogo)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                showLogo
                  ? 'bg-brand-primary text-bg-app hover:opacity-90'
                  : 'bg-surface-2 text-secondary hover:bg-surface-3'
              }`}
            >
              Logo: {showLogo ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className={`w-full aspect-video relative bg-surface-2 rounded-lg overflow-hidden shadow-inner transition-all ${
          showLogo
            ? 'border-4 border-brand-primary'
            : 'border-2 border-subtle'
        }`}>
          <VirtualScreen>
            <OutputView />
          </VirtualScreen>
        </div>

        {/* Projection panel placed directly under the preview for easier operator access */}
        <div className="w-full bg-surface-1 border border-subtle rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Proyección</h4>
            <div className="text-sm text-secondary">Output: {outputWinRef.current && !outputWinRef.current.closed ? 'Sí' : 'No'} · Stage: {stageWinRef.current && !stageWinRef.current.closed ? 'Sí' : 'No'}</div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {screensList.length > 0 ? (
                screensList.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-surface-2/40 border border-subtle rounded px-3 py-2">
                    <div className="text-sm text-secondary mr-2">{s.label}</div>
                    <button
                      onClick={() => openProjection('output', s)}
                      className="px-2 py-1 bg-brand-primary text-bg-app text-sm rounded hover:opacity-90 transition-opacity"
                    >
                      Enviar Output
                    </button>
                    <button
                      onClick={() => openProjection('stage', s)}
                      className="px-2 py-1 bg-status-success text-white text-sm rounded hover:opacity-90 transition-opacity"
                    >
                      Enviar Stage
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">No se detectaron pantallas. Usando pantalla principal.</div>
              )}
            </div>
            {/* Hint when output window is not open */}
            {!outputWinRef.current || outputWinRef.current.closed ? (
              <div className="text-sm text-muted">Output: No — Abre Output con el botón "Enviar Output"</div>
            ) : null}
          </div>
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

