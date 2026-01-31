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
      <div className="text-center text-muted py-12">
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
      {sections.map((section, index) => {
        const slideIsActive = isActive(section)
        const slideNumber = index + 1
        return (
          <div
            key={section.id}
            onClick={() => handleClick(section)}
            className={`bg-surface-1 rounded-lg p-4 border flex flex-col cursor-pointer transition-all relative min-h-[120px] ${
              slideIsActive
                ? 'border-brand-primary border-2 shadow-lg shadow-brand-primary/50'
                : 'border-subtle hover:border-medium'
            }`}
          >
            {/* Badge tipo - esquina superior izquierda */}
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                slideIsActive
                  ? 'bg-brand-primary text-bg-app'
                  : 'text-white bg-surface-2'
              }`}>
                {getSectionTypeLabel(section.section_type)}
              </span>
            </div>

            {/* Badge número - esquina superior derecha */}
            <div className="absolute top-4 right-4">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                slideIsActive
                  ? 'bg-brand-primary text-bg-app'
                  : 'bg-surface-2 text-text-secondary'
              }`}>
                #{slideNumber}
              </span>
            </div>
            
            {/* Texto de la sección */}
            <div className="flex-1 pr-12 min-w-0">
              <p className="text-white whitespace-pre-wrap break-words text-sm line-clamp-4">
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

