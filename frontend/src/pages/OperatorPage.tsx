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
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar con lista de canciones / biblias */}
      <div className="w-64 bg-gray-800 rounded-lg p-4 overflow-y-auto flex flex-col">
        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setLeftTab('songs')}
            className={`px-3 py-1 rounded-l-md text-sm font-medium ${leftTab === 'songs' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Canciones
          </button>
          <button
            onClick={() => setLeftTab('bibles')}
            className={`px-3 py-1 rounded-r-md text-sm font-medium ${leftTab === 'bibles' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
          </>
        ) : (
          // Bibles tab
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-white">Biblias</h2>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={bibleQuery}
                onChange={(e) => setBibleQuery(e.target.value)}
                placeholder="Ej: Juan 3:16"
                className="w-full px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none"
              />
            </div>
            <div className="mb-3 flex items-center gap-2">
              <select
                value={bibleVersion}
                onChange={(e) => setBibleVersion(e.target.value)}
                className="w-full px-2 py-2 rounded bg-gray-900 text-white border border-gray-700"
              >
                <option>RVR1960</option>
                <option>NVI</option>
                <option>NTV</option>
                <option>LBLA</option>
                <option>KJV</option>
              </select>
            </div>
            <div className="mb-3">
              <button
                onClick={async () => {
                  // Basic parse of query like 'Juan 3:16' or 'John 3:16-17'
                  try {
                    const raw = bibleQuery.trim()
                    if (!raw) return
                    // Very simple parser: split by space
                    const parts = raw.split(' ')
                    const book = parts[0]
                    const rest = parts[1] || ''
                    let chapter = ''
                    let verse_start = ''
                    let verse_end = ''
                    if (rest.includes(':')) {
                      const [c, v] = rest.split(':')
                      chapter = c
                      if (v.includes('-')) {
                        const [vs, ve] = v.split('-')
                        verse_start = vs
                        verse_end = ve
                      } else {
                        verse_start = v
                      }
                    }

                    const params = new URLSearchParams({
                      version: bibleVersion,
                      book: book,
                      chapter: chapter,
                      verse_start: verse_start,
                    })
                    if (verse_end) params.append('verse_end', verse_end)

                    const url = `http://127.0.0.1:8000/api/bible/passage/?${params.toString()}`
                    const resp = await fetchWithAuth(url)
                    if (!resp.ok) {
                      const txt = await resp.text().catch(() => '')
                      console.error('Bible search error', resp.status, txt)
                      setBibleSearchResult({ error: `Error ${resp.status}` })
                      return
                    }
                    const data = await resp.json()
                    setBibleSearchResult(data)
                  } catch (err) {
                    console.error('Bible search failed', err)
                    setBibleSearchResult({ error: 'Network error' })
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Buscar
              </button>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Próximamente: búsqueda bíblica</div>
            </div>
          </>
        )}
      </div>

      {/* Panel principal (para slides) */}
      <div className="flex-1 bg-gray-800 rounded-lg p-6 overflow-y-auto">
        {leftTab === 'bibles' ? (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Resultado de búsqueda</h2>
            </div>

            {bibleSearchResult ? (
              bibleSearchResult.error ? (
                <div className="text-red-400">{bibleSearchResult.error}</div>
              ) : (
                <div className="bg-gray-900 p-4 rounded text-white overflow-auto">
                  <h3 className="font-semibold mb-2">{bibleSearchResult.reference} — {bibleSearchResult.version}</h3>
                  <pre className="whitespace-pre-wrap">{bibleSearchResult.text}</pre>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Realiza una búsqueda para ver resultados</p>
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
          ))
        )}
      </div>

      {/* Right column: Output Preview + Projection controls */}
      <div className="w-[480px] bg-gray-800 rounded-lg p-4 flex flex-col gap-4">
        <div className="mb-0 flex items-center justify-between">
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

        {/* Projection panel placed directly under the preview for easier operator access */}
        <div className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Proyección</h4>
            <div className="text-sm text-gray-300">Output: {outputWinRef.current && !outputWinRef.current.closed ? 'Sí' : 'No'} · Stage: {stageWinRef.current && !stageWinRef.current.closed ? 'Sí' : 'No'}</div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {screensList.length > 0 ? (
                screensList.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-gray-900/40 border border-gray-700 rounded px-3 py-2">
                    <div className="text-sm text-gray-200 mr-2">{s.label}</div>
                    <button
                      onClick={() => openProjection('output', s)}
                      className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Enviar Output
                    </button>
                    <button
                      onClick={() => openProjection('stage', s)}
                      className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Enviar Stage
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">No se detectaron pantallas. Usando pantalla principal.</div>
              )}
            </div>
            {/* Hint when output window is not open */}
            {!outputWinRef.current || outputWinRef.current.closed ? (
              <div className="text-sm text-gray-400">Output: No — Abre Output con el botón "Enviar Output"</div>
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

