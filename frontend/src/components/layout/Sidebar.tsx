import { NavLink } from 'react-router-dom'
import { Home, Radio, Settings, Users, Puzzle, Wand2, ChevronDown } from 'lucide-react'

interface NavItem {
  label: string
  to?: string
  icon: React.ReactNode
  disabled?: boolean
}

const navItems: NavItem[] = [
  { label: 'Home', icon: <Home size={20} />, disabled: true },
  { label: 'Operador', to: '/operator', icon: <Radio size={20} /> },
  { label: 'Usuarios', icon: <Users size={20} />, disabled: true },
  { label: 'Integraciones', icon: <Puzzle size={20} />, disabled: true },
  { label: 'AI builder', icon: <Wand2 size={20} />, disabled: true },
  { label: 'Configuración', to: '/settings', icon: <Settings size={20} /> },
]

function Sidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 bg-surface-1 border-r border-subtle flex flex-col">
      {/* Workspace Selector */}
      <div className="px-4 py-6 border-b border-subtle">
        <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-primary">E</span>
            </div>
            <div className="text-left text-sm">
              <p className="font-medium text-text-primary">Espacio de trabajo</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-text-muted" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.to) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="text-text-muted">{item.icon}</div>
                <span className="text-sm text-text-muted">{item.label}</span>
              </div>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-primary/20 text-brand-primary border-l-2 border-brand-primary'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                }`
              }
            >
              <div>{item.icon}</div>
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-t border-subtle">
        <div className="px-3 py-3 rounded-lg bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-primary">U</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">Usuario</p>
              <p className="text-xs text-text-muted truncate">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
