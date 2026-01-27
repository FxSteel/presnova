import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import OperatorPage from '../pages/OperatorPage'
import OutputPage from '../pages/OutputPage'
import StagePage from '../pages/StagePage'
import SettingsPage from '../pages/SettingsPage'
import { useAuth } from '../context/AuthContext'

function AppRouter() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/operator" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Protected routes with sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/stage" element={<StagePage />} />
      </Route>
      {/* Output is a full-screen view without sidebar */}
      <Route
        path="/output"
        element={
          <ProtectedRoute>
            <OutputPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRouter

