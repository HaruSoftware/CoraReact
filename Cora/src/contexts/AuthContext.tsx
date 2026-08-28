import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../services/api'
import {
  getToken,
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
  token: string | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (
    nomeEmpresa: string,
    emailEmpresa: string,
    nome: string,
    email: string,
    senha: string
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextData | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(getToken())
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function verificarSessao() {
      const tokenAtual = getToken()

      if (!tokenAtual) {
        setCarregando(false)
        return
      }

      try {
        const data = await api('/auth/me', {
          token: tokenAtual,
        })

        setUsuario(data.usuario)
        setToken(tokenAtual)
      } catch {
        logoutApi()
        setUsuario(null)
        setToken(null)
      } finally {
        setCarregando(false)
      }
    }

    verificarSessao()
  }, [])

  async function login(email: string, senha: string) {
    const data = await loginApi(email, senha)

    const tokenNovo = data.token

    const usuarioData = await api('/auth/me', {
      token: tokenNovo,
    })

    setToken(tokenNovo)
    setUsuario(usuarioData.usuario)
  }

  async function register(
    nomeEmpresa: string,
    emailEmpresa: string,
    nome: string,
    email: string,
    senha: string
  ) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nomeEmpresa,
        emailEmpresa,
        nome,
        email,
        senha,
      }),
    })

    const tokenNovo = data.token

    const usuarioData = await api('/auth/me', {
      token: tokenNovo,
    })

    setToken(tokenNovo)
    setUsuario(usuarioData.usuario)
  }

  function logout() {
    logoutApi()
    setUsuario(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
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