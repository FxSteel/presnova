'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

import { useWorkspace } from '@/lib/workspace-context'

export default function SettingsPage() {
  const { workspaces, activeWorkspaceId } = useWorkspace()
  const { theme, setTheme } = useAppStore()
  const [language, setLanguage] = useState('es')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)

  useEffect(() => {
    if (!activeWorkspace) return

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_settings')
          .select('*')
          .eq('workspace_id', activeWorkspace.id)
          .single()

        if (data) {
          if (data.language) setLanguage(data.language)
          if (data.logo_url) setLogoUrl(data.logo_url)
          if (data.theme_mode) setTheme(data.theme_mode)
        }
      } catch (err) {
        console.log('No settings found, using defaults')
      }
    }

    fetchSettings()
  }, [activeWorkspace, setTheme])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeWorkspace || !e.target.files?.[0]) return

    const file = e.target.files[0]
    setUploading(true)
    setMessage('')

    try {
      const fileName = `${activeWorkspace.id}/logo-${Date.now()}`
      const { data, error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(fileName)

      setLogoUrl(publicUrl.publicUrl)

      // Save to settings
      const { error: updateError } = await supabase
        .from('workspace_settings')
        .update({ logo_url: publicUrl.publicUrl })
        .eq('workspace_id', activeWorkspace.id)

      if (updateError && updateError.code !== 'PGRST116') throw updateError

      setMessage('Logo guardado correctamente')
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!activeWorkspace) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('workspace_settings')
        .update({
          language,
          theme_mode: theme,
        })
        .eq('workspace_id', activeWorkspace.id)

      if (error && error.code !== 'PGRST116') throw error

      setMessage('Configuración guardada')
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full h-full overflow-auto p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Configuración</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.startsWith('Error')
                ? 'bg-red-900/20 text-red-400 border border-red-800'
                : 'bg-green-900/20 text-green-400 border border-green-800'
            }`}
          >
            {message}
          </div>
        )}

          {/* Language Section */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Idioma</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecciona tu idioma
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>

          {/* Theme Section */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Tema</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-3 rounded border-2 transition-colors capitalize ${
                    theme === t
                      ? 'border-[#7C6FD8] bg-[#7C6FD8]/10 text-white'
                      : 'border-[#333] bg-[#2a2a2a] text-gray-300 hover:border-[#555]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Section */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Logo del Espacio</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Sube tu logo
              </label>
              {logoUrl && (
                <div className="mb-4 p-3 bg-[#2a2a2a] rounded">
                  <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="w-full"
              />
              {uploading && <p className="text-sm text-gray-400 mt-2">Subiendo...</p>}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
      </div>
    </div>
  )
}
