import { useEffect, useRef, useState, ReactNode } from 'react'

interface VirtualScreenProps {
  children: ReactNode
  width?: number
  height?: number
  className?: string
}

function VirtualScreen({ 
  children, 
  width = 1920, 
  height = 1080, 
  className = '' 
}: VirtualScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const scaleX = containerWidth / width
      const scaleY = containerHeight / height
      const newScale = Math.min(scaleX, scaleY)

      setScale(newScale)
    }

    // Calcular scale inicial
    updateScale()

    // Observar cambios de tamaño
    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [width, height])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="absolute"
      >
        {children}
      </div>
    </div>
  )
}

export default VirtualScreen

