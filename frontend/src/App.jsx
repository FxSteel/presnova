import AppRouter from './router/AppRouter'
import { PresentationProvider } from './context/PresentationContext'

function App() {
  return (
    <PresentationProvider>
      <AppRouter />
    </PresentationProvider>
  )
}

export default App

