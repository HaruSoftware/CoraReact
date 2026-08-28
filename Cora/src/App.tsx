import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Layout from './components/Layout'

import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          usuario ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      <Route
        path="/register"
        element={
          usuario ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />

      <Route
        path="/"
        element={
          usuario ? <Layout /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="*"
        element={<Navigate to={usuario ? '/' : '/login'} replace />}
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App