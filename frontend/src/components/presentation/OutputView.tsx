import { usePresentation } from '../../context/PresentationContext'

interface OutputViewProps {
  className?: string
}

function OutputView({ className = '' }: OutputViewProps) {
  const { activeSlide } = usePresentation()

  return (
    <div
      className={`w-full h-full bg-black flex items-center justify-center select-none overflow-hidden cursor-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* 16:9 container sized to fit the parent */}
      <div
        style={{
          width: 'min(100%, calc(100%))',
          height: 'min(100%, calc(100%))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeSlide ? (
          <div className="w-full h-full flex items-center justify-center px-6">
            <p
              className="text-white whitespace-pre-wrap text-center break-words leading-tight"
              style={{ fontSize: 'calc(1.8vw + 2.2vh)', maxWidth: '85%' }}
            >
              {activeSlide.text || ''}
            </p>
          </div>
        ) : (
          // When there's no active slide, render nothing (pure black)
          <div style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  )
}

export default OutputView

