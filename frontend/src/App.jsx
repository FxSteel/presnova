import AppRouter from './router/AppRouter'
import { PresentationProvider } from './context/PresentationContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <PresentationProvider>
        <AppRouter />
      </PresentationProvider>
    </AuthProvider>
  )
}

export default App

