import { SongSection, setPresentationState } from '../../api/client'
import { usePresentation } from '../../context/PresentationContext'

interface SongSlidesGridProps {
  sections?: SongSection[]
}

function SongSlidesGrid({ sections }: SongSlidesGridProps) {
  const { activeSlide, setActiveSlide } = usePresentation()

  // Validar que sections sea un array y no esté vacío
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg">Esta canción aún no tiene slides configurados.</p>
      </div>
    )
  }

  // Función para obtener el label del tipo de sección
  const getSectionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      verse: 'Verse',
      chorus: 'Chorus',
      bridge: 'Bridge',
      prechorus: 'Pre-chorus',
      intro: 'Intro',
      outro: 'Outro',
      tag: 'Tag',
      other: 'Other',
    }
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  const isActive = (section: SongSection): boolean => {
    return activeSlide !== null && 
           activeSlide.id === section.id && 
           activeSlide.order === section.order
  }

  const handleClick = async (section: SongSection) => {
    try {
      console.log('[Operator] set presentation state, section_id=', section.id)
      await setPresentationState(section.id as number)
      // Do not set local activeSlide here; PresentationContext polls backend and will update preview/output
    } catch (err) {
      console.error('Error setting presentation state:', err)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {sections.map((section) => {
        const slideIsActive = isActive(section)
        return (
          <div
            key={section.id}
            onClick={() => handleClick(section)}
            className={`bg-slate-800 rounded-lg p-4 border flex flex-col cursor-pointer transition-all ${
              slideIsActive
                ? 'border-blue-500 border-2 shadow-lg shadow-blue-500/50'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            {/* Pill con el tipo de sección */}
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                slideIsActive
                  ? 'bg-blue-600 text-white'
                  : 'text-white bg-slate-700'
              }`}>
                {getSectionTypeLabel(section.section_type)}
              </span>
            </div>
            
            {/* Texto de la sección */}
            <div className="flex-1">
              <p className="text-white whitespace-pre-wrap break-words">
                {section.text || '(Sin texto)'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SongSlidesGrid

