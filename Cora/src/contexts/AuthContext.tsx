import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../services/api'
import {
  login as loginApi,
  logout as logoutApi,
} from '../services/auth'

type Usuario = {
  id_usuario: number
  id_conta: number
  nome: string
  email: string
}

type AuthContextData = {
  usuario: Usuario | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (
    nomeEmpresa: string,
    emailEmpresa: string,
    nome: string,
    email: string,
    senha: string
  ) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData | undefined>(undefined)

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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.')
  }

  return context
}