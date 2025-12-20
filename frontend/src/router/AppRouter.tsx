import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import OperatorPage from '../pages/OperatorPage'
import OutputPage from '../pages/OutputPage'
import StagePage from '../pages/StagePage'

function AppRouter() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/operator" replace />} />
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/output" element={<OutputPage />} />
        <Route path="/stage" element={<StagePage />} />
      </Routes>
    </Layout>
  )
}

export default AppRouter

