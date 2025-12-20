import React, { createContext, useContext, useState, ReactNode } from 'react'
import { SongSection } from '../api/client'

interface PresentationContextType {
  activeSlide: SongSection | null
  setActiveSlide: (slide: SongSection | null) => void
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined)

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [activeSlide, setActiveSlide] = useState<SongSection | null>(null)

  return (
    <PresentationContext.Provider value={{ activeSlide, setActiveSlide }}>
      {children}
    </PresentationContext.Provider>
  )
}

export function usePresentation() {
  const context = useContext(PresentationContext)
  if (context === undefined) {
    throw new Error('usePresentation must be used within a PresentationProvider')
  }
  return context
}

