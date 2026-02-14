'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { CircleUser, ChevronDown, Home, Users, Zap, Lightbulb, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useActiveWorkspace } from '@/lib/workspace-provider'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  const activeWorkspace = useActiveWorkspace()

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
      {/* Workspace Display */}
      <div className="p-3 border-b border-[#333]">
        <div className="w-full flex items-center justify-between p-2 bg-[#2a2a2a] rounded-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-[#7C6FD8] rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {activeWorkspace?.name?.charAt(0) || 'W'}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-gray-200 text-xs font-medium truncate">
                {activeWorkspace?.name || 'Sin workspace'}
              </p>
              <p className="text-gray-500 text-[10px] capitalize truncate">
                {activeWorkspace?.role || ''}
              </p>
            </div>
          </div>
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

      {/* User Profile Box */}
      <div className="p-4 border-t border-[#333]">
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 bg-[#2a2a2a] hover:bg-[#333] rounded transition-colors"
          >
            <CircleUser size={20} className="text-[#7C6FD8]" />
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-white text-sm truncate">{user?.user_metadata?.full_name || user?.email}</div>
              <div className="text-xs text-gray-400 truncate">user</div>
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
