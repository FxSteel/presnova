import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { SongSection, fetchWithAuth } from '../api/client'

interface PresentationContextType {
  activeSlide: SongSection | null
  setActiveSlide: (slide: SongSection | null) => void
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined)

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [activeSlide, setActiveSlide] = useState<SongSection | null>(null)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchActive = async () => {
      try {
        const resp = await fetchWithAuth('http://127.0.0.1:8000/api/presentation/output/')
        if (!mounted) return
        if (resp.status === 401) {
          console.warn('[Output] /api/presentation/output/ returned 401')
          // fetchWithAuth may redirect to /login; still return
          return
        }

        if (!resp.ok) {
          console.warn('[Output] /api/presentation/output/ returned', resp.status)
          return
        }

        const data = await resp.json()
        const active = data && data.active ? data.active as SongSection : null
        if (active === null) {
          console.info('[Output] presentation output active is null')
        }

        // Update only when changed to avoid rerenders
        if ((active && !activeSlide) || (!active && activeSlide) || (active && activeSlide && active.id !== activeSlide.id)) {
          setActiveSlide(active)
        }
      } catch (err) {
        // ignore network errors silently
        // fetchWithAuth may redirect to /login on auth failure
      }
    }

    // start polling
    fetchActive()
    pollingRef.current = window.setInterval(fetchActive, 400)

    return () => {
      mounted = false
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

