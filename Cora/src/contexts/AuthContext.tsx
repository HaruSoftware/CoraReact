import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../services/api'
import { AuthContext, type Usuario } from './AuthContextValue'
import {
  login as loginApi,
  logout as logoutApi,
} from '../services/auth'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function verificarSessao() {
      try {
        const data = await api('/auth/me')

        setUsuario(data.usuario)
      } catch {
        setUsuario(null)
      } finally {
        setCarregando(false)
      }
    }

    verificarSessao()
  }, [])

  async function login(email: string, senha: string) {
    await loginApi(email, senha)

    const usuarioData = await api('/auth/me')

    setUsuario(usuarioData.usuario)
  }

  async function atualizarUsuario() {
    const usuarioData = await api('/auth/me')
    setUsuario(usuarioData.usuario)
  }

  async function register(
    nomeEmpresa: string,
    emailEmpresa: string,
    nome: string,
    email: string,
    senha: string
  ) {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nomeEmpresa,
        emailEmpresa,
        nome,
        email,
        senha,
      }),
    })

    const usuarioData = await api('/auth/me')

    setUsuario(usuarioData.usuario)
  }

  async function logout() {
    await logoutApi()

    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        login,
        register,
        logout,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}