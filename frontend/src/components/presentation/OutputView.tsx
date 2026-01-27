import { usePresentation } from '../../context/PresentationContext'
import { useEffect, useState } from 'react'
import LogoScreen from './LogoScreen'

interface OutputViewProps {
  className?: string
}

function OutputView({ className = '' }: OutputViewProps) {
  const { activeSlide } = usePresentation()
  const [showLogo, setShowLogo] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  // Listen for localStorage changes (from Operator or other tabs)
  useEffect(() => {
    const updateLogoState = () => {
      const value = localStorage.getItem('presnova.output.showLogo')
      setShowLogo(value === 'true')
    }
    
    // Initial load
    updateLogoState()
    
    // Listen for storage changes from other windows/tabs
    window.addEventListener('storage', updateLogoState)
    
    // Also listen for custom events within the same window
    window.addEventListener('logoToggleChange', updateLogoState)
    
    return () => {
      window.removeEventListener('storage', updateLogoState)
      window.removeEventListener('logoToggleChange', updateLogoState)
    }
  }, [])

  // Load logo from localStorage
  useEffect(() => {
    const savedLogoDataUrl = localStorage.getItem('presnova.settings.logoDataUrl')
    setLogoDataUrl(savedLogoDataUrl)

    // Listen for changes to logo settings
    const handleStorageChange = () => {
      const updated = localStorage.getItem('presnova.settings.logoDataUrl')
      setLogoDataUrl(updated)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div
      className={`w-full h-full bg-black select-none overflow-hidden cursor-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Conditional render: Logo screen OR Slide content */}
      {showLogo ? (
        <LogoScreen logoSrc={logoDataUrl} />
      ) : (
        /* Slide content - rendered when showLogo is false */
        <>
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
            /* When there's no active slide, render pure black */
            <div style={{ width: '100%', height: '100%' }} />
          )}
        </>
      )}
    </div>
  )
}

export default OutputView

