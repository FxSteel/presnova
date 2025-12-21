import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-white hover:text-gray-300">
                PresNova
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/operator"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/operator') 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Operador
              </Link>
              {/* Output and Stage are controlled from the Operator; remove top-level navigation to avoid operator leaving the control view */}
              {user && (
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-700">
                  <span className="text-sm text-gray-400">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout

