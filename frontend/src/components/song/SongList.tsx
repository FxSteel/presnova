import { Song } from '../../api/client'

interface SongListProps {
  songs: Song[]
  onSongSelect?: (song: Song) => void
  selectedSongId?: number | null
}

function SongList({ songs, onSongSelect, selectedSongId }: SongListProps) {
  // Validar que songs sea un array
  if (!Array.isArray(songs)) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>Error: formato de datos inválido</p>
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No hay canciones disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {songs.map((song) => (
        <div
          key={song.id}
          onClick={() => onSongSelect?.(song)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedSongId === song.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <h3 className="font-semibold text-lg">{song.title || 'Sin título'}</h3>
          {song.author && (
            <p className="text-sm opacity-75 mt-1">{song.author}</p>
          )}
          {song.key && (
            <p className="text-xs opacity-60 mt-1">Tono: {song.key}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default SongList

