'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter, usePathname } from 'next/navigation'
import { CircleUser, ChevronDown, Home, Users, Zap, Lightbulb, Settings, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { useWorkspace, useActiveWorkspace } from '@/lib/workspace-provider'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  const { workspaces, setActiveWorkspace, createWorkspace } = useWorkspace()
  const activeWorkspace = useActiveWorkspace()

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut()
    router.replace('/auth/login')
  }

  const handleCreateWorkspace = async () => {
    setShowWorkspaceMenu(false)
    await createWorkspace()
  }

  const navItems = [
    { href: '/operator', label: 'Home', icon: Home, disabled: true },
    { href: '/operator', label: 'Operador', icon: Zap, disabled: false },
    { href: '#', label: 'Usuarios', icon: Users, disabled: true },
    { href: '#', label: 'Integraciones', icon: Lightbulb, disabled: true },
    { href: '#', label: 'AI builder', icon: Lightbulb, disabled: true },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col overflow-hidden">
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-[#333] relative" ref={workspaceMenuRef}>
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7C6FD8] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {activeWorkspace?.name?.charAt(0) || 'W'}
              </span>
            </div>
            <div className="text-left">
              <p className="text-gray-200 text-sm font-medium truncate">
                {activeWorkspace?.name || 'Loading...'}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {activeWorkspace?.role || ''}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            showWorkspaceMenu ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Workspace Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-50">
            <div className="p-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    setActiveWorkspace(workspace.id)
                    setShowWorkspaceMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded hover:bg-[#333] transition-colors ${
                    workspace.id === activeWorkspace?.id ? 'bg-[#333]' : ''
                  }`}
                >
                  <div className="w-6 h-6 bg-[#7C6FD8] rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {workspace.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-200 text-sm truncate">{workspace.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{workspace.role}</p>
                  </div>
                </button>
              ))}
              
              <hr className="border-[#444] my-2" />
              
              <button
                onClick={handleCreateWorkspace}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#333] transition-colors text-[#7C6FD8]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Crear workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Link key={`nav-item-${index}`} href={item.disabled ? '#' : item.href}>
              <button
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors text-sm ${
                  item.disabled
                    ? 'text-gray-600 cursor-not-allowed opacity-50'
                    : isActive(item.href)
                      ? 'bg-[#7C6FD8] text-white'
                      : 'text-gray-300 hover:bg-[#2a2a2a]'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            </Link>
          )
        })}
      </nav>

      {/* Settings Link */}
      <div className="p-4 border-t border-[#333]">
        <Link href="/settings">
          <button
            className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors text-sm ${
              isActive('/settings')
                ? 'bg-[#7C6FD8] text-white'
                : 'text-gray-300 hover:bg-[#2a2a2a]'
            }`}
          >
            <Settings size={18} />
            Configuración
          </button>
        </Link>
      </div>

      {/* User Profile Box */}
      <div className="p-4 border-t border-[#333]">
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded transition-colors"
          >
            <CircleUser size={20} className="text-[#7C6FD8]" />
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-white text-sm truncate">{user?.full_name || user?.email}</div>
              <div className="text-xs text-gray-400 truncate">{user?.role || 'user'}</div>
            </div>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2a2a2a] border border-[#333] rounded shadow-lg z-10 w-full">
              <button
                disabled
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] transition-colors cursor-not-allowed"
              >
                Perfil
              </button>
              <Link href="/settings" className="block">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#333] transition-colors"
                >
                  Configuraciones
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2 border-t border-[#333]"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
