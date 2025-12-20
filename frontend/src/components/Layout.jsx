import { Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

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
            <div className="flex space-x-4">
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
              <Link
                to="/output"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/output') 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Salida
              </Link>
              <Link
                to="/stage"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/stage') 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Escenario
              </Link>
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

