import { useState, useEffect } from 'react'

function SettingsPage() {
  const [language, setLanguage] = useState('es')
  const [theme, setTheme] = useState('system')
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('presnova.settings.language') || 'es'
    const savedTheme = localStorage.getItem('presnova.settings.theme') || 'system'
    const savedLogo = localStorage.getItem('presnova.settings.logoDataUrl')

    setLanguage(savedLanguage)
    setTheme(savedTheme)
    if (savedLogo) {
      setLogoDataUrl(savedLogo)
      setLogoPreview(savedLogo)
    }
  }, [])

  // Apply theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const applyTheme = (selectedTheme: string) => {
    const html = document.documentElement

    if (selectedTheme === 'system') {
      html.classList.remove('light', 'dark')
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark')
      } else {
        html.classList.add('light')
      }
    } else if (selectedTheme === 'light') {
      html.classList.remove('dark')
      html.classList.add('light')
    } else if (selectedTheme === 'dark') {
      html.classList.remove('light')
      html.classList.add('dark')
    }

    localStorage.setItem('presnova.settings.theme', selectedTheme)
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    localStorage.setItem('presnova.settings.language', newLanguage)
  }

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value
    setTheme(newTheme)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setLogoDataUrl(dataUrl)
        setLogoPreview(dataUrl)
        localStorage.setItem('presnova.settings.logoDataUrl', dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoDataUrl(null)
    setLogoPreview(null)
    localStorage.removeItem('presnova.settings.logoDataUrl')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Configuraciones</h1>

      {/* Language Section */}
      <div className="bg-surface-1 rounded-lg p-6 mb-6 border border-subtle">
        <h2 className="text-xl font-semibold mb-4 text-white">Idioma</h2>
        <div className="flex flex-col gap-3">
          <label htmlFor="language" className="text-sm text-secondary">
            Selecciona tu idioma preferido
          </label>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
            className="w-full px-4 py-2 rounded-lg bg-surface-2 text-white border border-subtle focus:outline-none focus:border-brand-primary transition-colors"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-surface-1 rounded-lg p-6 mb-6 border border-subtle">
        <h2 className="text-xl font-semibold mb-4 text-white">Logo</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-secondary">
            Carga un logo que se mostrará como overlay en el output cuando el toggle "Logo" esté activo.
          </p>

          {/* Logo Preview */}
          {logoPreview && (
            <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-lg border border-subtle">
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{
                  maxWidth: '120px',
                  maxHeight: '120px',
                  objectFit: 'contain',
                }}
              />
              <div className="text-sm text-secondary">
                <p>Logo actual guardado</p>
              </div>
            </div>
          )}

          {/* File Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="logoUpload" className="text-sm text-secondary">
              Seleccionar archivo (PNG, SVG, JPG)
            </label>
            <input
              id="logoUpload"
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              onChange={handleLogoUpload}
              className="w-full px-4 py-2 rounded-lg bg-surface-2 text-white border border-subtle focus:outline-none focus:border-brand-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-brand-primary file:text-bg-app file:cursor-pointer"
            />
          </div>

          {/* Remove Logo Button */}
          {logoDataUrl && (
            <button
              onClick={handleRemoveLogo}
              className="w-full px-4 py-2 rounded-lg bg-status-error text-white hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Eliminar logo
            </button>
          )}
        </div>
      </div>

      {/* Theme Section */}
      <div className="bg-surface-1 rounded-lg p-6 border border-subtle">
        <h2 className="text-xl font-semibold mb-4 text-white">Tema del Sistema</h2>
        <div className="flex flex-col gap-3">
          <label htmlFor="theme" className="text-sm text-secondary">
            Selecciona el tema de la interfaz
          </label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className="w-full px-4 py-2 rounded-lg bg-surface-2 text-white border border-subtle focus:outline-none focus:border-brand-primary transition-colors"
          >
            <option value="system">Sistema (automático)</option>
            <option value="light">Blanco (claro)</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
