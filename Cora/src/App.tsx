import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/authContext'

function AppContent() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!usuario) {
    return <LoginPage />
  }

  return <Layout />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
