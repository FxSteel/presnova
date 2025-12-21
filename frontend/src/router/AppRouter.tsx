import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import OperatorPage from '../pages/OperatorPage'
import OutputPage from '../pages/OutputPage'
import StagePage from '../pages/StagePage'
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
      <Route
        path="/operator"
        element={
          <ProtectedRoute>
            <Layout>
              <OperatorPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/output"
        element={
          <ProtectedRoute>
            {/* Output must be a dedicated full-screen view without the operator layout */}
            <OutputPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stage"
        element={
          <ProtectedRoute>
            <Layout>
              <StagePage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRouter

