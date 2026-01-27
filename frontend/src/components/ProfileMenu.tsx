import { useState, useRef, useEffect } from 'react'

// Profile icon SVG component
const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="10" r="3"/>
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
  </svg>
)

function ProfileMenu({ username = 'Usuario' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
      >
        <ProfileIcon />
        <span>{username}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-50">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setIsOpen(false)
              // Placeholder: Profile not navigating yet
            }}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white rounded-t-lg transition-colors"
          >
            Perfil
          </a>
          <a
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white rounded-b-lg transition-colors"
          >
            Configuraciones
          </a>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
