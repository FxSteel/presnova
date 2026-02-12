'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, CircleUser, Home, Users, Zap, Lightbulb, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const { user, activeWorkspace, workspaces, setActiveWorkspace, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  const handleSignOut = async () => {
    setShowUserMenu(false)
    await signOut()
    router.replace('/auth/login')
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
      {/* Workspace Selector */}
      <div className="p-4 border-b border-[#333]">
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center justify-between p-3 bg-[#2a2a2a] hover:bg-[#333] rounded transition-colors text-sm"
          >
            <div className="text-left">
              <div className="text-xs text-gray-400">Espacio de trabajo</div>
              <div className="font-medium text-white truncate">{activeWorkspace?.name || 'No workspace'}</div>
            </div>
            <ChevronDown size={16} className={`transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
          </button>

          {showWorkspaceMenu && workspaces.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] border border-[#333] rounded shadow-lg z-10">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws)
                    setShowWorkspaceMenu(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    activeWorkspace?.id === ws.id
                      ? 'bg-[#7C6FD8] text-white'
                      : 'text-gray-300 hover:bg-[#333]'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <div className="relative">
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
