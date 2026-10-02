import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Layout from './components/Layout'
import SettingsPage from './pages/SettingsPage'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import CustomersPage from './pages/CustomersPage'
import SalesPage from './pages/SalesPage'
import PlanSelectionPage from './pages/PlanSelectionPage'
import AppLoading from './components/AppLoading'

import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContextValue'
import { ToastProvider } from './contexts/ToastContext'

function AppContent() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return <AppLoading />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          usuario ? <Navigate to={usuario.tem_assinatura_ativa ? '/' : '/escolher-plano'} replace /> : <LoginPage />
        }
      />

      <Route
        path="/register"
        element={
          usuario ? <Navigate to={usuario.tem_assinatura_ativa ? '/' : '/escolher-plano'} replace /> : <RegisterPage />
        }
      />

      <Route
        path="/escolher-plano"
        element={
          !usuario ? <Navigate to="/login" replace /> :
            usuario.tem_assinatura_ativa ? <Navigate to="/" replace /> : <PlanSelectionPage />
        }
      />

      <Route
        path="/"
        element={
          !usuario ? <Navigate to="/login" replace /> :
            usuario.tem_assinatura_ativa ? <Layout /> : <Navigate to="/escolher-plano" replace />
        }
      >
        <Route path="settings" element={<SettingsPage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="vendas" element={<SalesPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={usuario ? (usuario.tem_assinatura_ativa ? '/' : '/escolher-plano') : '/login'} replace />}
      />
    </Routes>

  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App