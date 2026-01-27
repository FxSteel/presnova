import { useAuth } from '../context/AuthContext'

function Layout({ children }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg-app text-text-primary">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout

