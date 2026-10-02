import { createContext, useContext } from 'react'

export type Usuario = {
  id_usuario: number
  id_conta: number
  nome: string
  email: string
  tem_assinatura_ativa: boolean
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
  atualizarUsuario: () => Promise<void>
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.')
  }

  return context
}