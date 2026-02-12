'use client'

import { useEffect, useRef, useState } from 'react'
import { useWorkspaceStore, WorkspaceMembership } from '@/lib/workspace-store'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Workspace {
  id: string
  name: string
}

export function WorkspaceSwitcher() {
  const { activeWorkspaceId, memberships, setActiveWorkspaceId } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch workspace details when memberships change
  useEffect(() => {
    if (!mounted || memberships.length === 0) return

    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        const workspaceIds = memberships.map((m: WorkspaceMembership) => m.workspace_id)
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name')
          .in('id', workspaceIds)

        if (error) throw error
        setWorkspaces(data || [])
      } catch (err) {
        console.error('[WorkspaceSwitcher] Error fetching workspaces:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [memberships, mounted])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = async (workspaceId: string) => {
    await setActiveWorkspaceId(workspaceId)
    setOpen(false)
  }

  if (!mounted) return null

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
  const displayName = activeWorkspace?.name || 'Seleccionar workspace'
  const hasMultiple = workspaces.length > 1

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        onClick={() => hasMultiple && setOpen(!open)}
        disabled={!hasMultiple}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-md border border-[#333] bg-[#2a2a2a] transition-colors text-sm',
          hasMultiple ? 'hover:bg-[#333] cursor-pointer' : 'cursor-default opacity-60'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-xs text-gray-400">Espacio de trabajo</div>
            <div className="font-medium truncate text-sm text-white">{displayName}</div>
          </div>
        </div>
        {hasMultiple && (
          <ChevronsUpDown size={16} className={cn('shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && hasMultiple && (
        <div
          ref={contentRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-md border border-[#333] bg-[#2a2a2a] text-foreground shadow-lg z-50 p-2 w-full"
        >
          {loading ? (
            <div className="px-2 py-4 text-center text-sm text-gray-400">Cargando...</div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                    activeWorkspaceId === workspace.id
                      ? 'bg-[#7C6FD8] text-white'
                      : 'text-gray-300 hover:bg-[#333]'
                  )}
                >
                  <span className="truncate">{workspace.name}</span>
                  {activeWorkspaceId === workspace.id && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
