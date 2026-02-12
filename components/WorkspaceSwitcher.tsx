'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load persisted workspace selection from localStorage
  useEffect(() => {
    if (!mounted) return

    const saved = localStorage.getItem('activeWorkspaceId')
    if (saved && workspaces.length > 0) {
      const workspace = workspaces.find((w) => w.id === saved)
      if (workspace && workspace.id !== activeWorkspace?.id) {
        setActiveWorkspace(workspace)
      }
    }
  }, [workspaces, mounted, activeWorkspace?.id, setActiveWorkspace])

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

  const handleSelect = (workspace: typeof workspaces[0]) => {
    setActiveWorkspace(workspace)
    localStorage.setItem('activeWorkspaceId', workspace.id)
    setOpen(false)
  }

  const handleAddWorkspace = () => {
    console.log('[WorkspaceSwitcher] Add workspace clicked')
    setOpen(false)
  }

  if (!mounted) return null

  const displayName = activeWorkspace?.name || 'No workspace'
  const isEmpty = workspaces.length === 0

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-[#333] bg-[#2a2a2a] hover:bg-[#333] transition-colors text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-xs text-gray-400">Espacio de trabajo</div>
            <div className="font-medium truncate text-sm text-white">{displayName}</div>
          </div>
        </div>
        <ChevronsUpDown size={16} className={cn('shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          ref={contentRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-md border border-[#333] bg-[#2a2a2a] text-foreground shadow-lg z-50 p-2 w-full"
        >
          {isEmpty ? (
            <div className="px-2 py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">No hay workspaces</p>
              <button
                onClick={handleAddWorkspace}
                className="w-full px-3 py-2 rounded-md bg-[#7C6FD8] text-white hover:bg-[#6C5FC8] text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Agregar workspace
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-2">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelect(workspace)}
                    className={cn(
                      'relative flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
                      'transition-colors',
                      activeWorkspace?.id === workspace.id
                        ? 'bg-[#7C6FD8] text-white'
                        : 'text-gray-300 hover:bg-[#333]'
                    )}
                  >
                    <Building2 size={14} className="shrink-0" />
                    <span className="truncate flex-1 text-left">{workspace.name}</span>
                    {activeWorkspace?.id === workspace.id && (
                      <Check size={14} className="shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#333]" />

              <button
                onClick={handleAddWorkspace}
                className={cn(
                  'relative flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
                  'cursor-pointer transition-colors text-gray-400 hover:text-gray-200 hover:bg-[#333]',
                  'mt-2'
                )}
              >
                <Plus size={14} className="shrink-0" />
                <span className="truncate flex-1 text-left">Agregar workspace</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
