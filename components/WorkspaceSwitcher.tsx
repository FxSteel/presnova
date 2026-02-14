'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/lib/workspace-provider'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher() {
  const { activeWorkspaceId, workspace, status } = useWorkspace()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || status !== 'ready' || !workspace) {
    return (
      <div className="w-full px-3 py-2 rounded-md border border-[#333] bg-[#2a2a2a] text-sm opacity-60">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-xs text-gray-400">Espacio de trabajo</div>
            <div className="font-medium truncate text-sm text-white">
              {status === 'error' ? 'Error cargando' : 'Cargando...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <div className="w-full px-3 py-2 rounded-md border border-[#333] bg-[#2a2a2a] text-sm cursor-default">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-xs text-gray-400">Espacio de trabajo</div>
            <div className="font-medium truncate text-sm text-white">{workspace.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
