import { usePresentation } from '../../context/PresentationContext'

interface OutputViewProps {
  className?: string
}

function OutputView({ className = '' }: OutputViewProps) {
  const { activeSlide } = usePresentation()

  return (
    <div className={`w-full h-full bg-black flex items-center justify-center ${className}`}>
      {activeSlide ? (
        <div className="w-full h-full flex items-center justify-center p-16">
          <p className="text-white whitespace-pre-wrap text-center break-words text-7xl leading-tight max-w-[1600px]">
            {activeSlide.text || '(Sin texto)'}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-white text-5xl">
            No hay slide activo
          </p>
        </div>
      )}
    </div>
  )
}

export default OutputView

