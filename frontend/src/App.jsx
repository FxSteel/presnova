import { useEffect } from 'react'
import AppRouter from './router/AppRouter'
import { PresentationProvider } from './context/PresentationContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('presnova.settings.theme') || 'system'
    const html = document.documentElement

    const applyTheme = (theme) => {
      if (theme === 'system') {
        html.classList.remove('light', 'dark')
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark')
        } else {
          html.classList.add('light')
        }
      } else if (theme === 'light') {
        html.classList.remove('dark')
        html.classList.add('light')
      } else if (theme === 'dark') {
        html.classList.remove('light')
        html.classList.add('dark')
      }
    }

    applyTheme(savedTheme)

    // Listen for system theme changes
    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (localStorage.getItem('presnova.settings.theme') === 'system' || !localStorage.getItem('presnova.settings.theme')) {
          applyTheme('system')
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <AuthProvider>
      <PresentationProvider>
        <AppRouter />
      </PresentationProvider>
    </AuthProvider>
  )
}

export default App

