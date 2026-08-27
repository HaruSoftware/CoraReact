import { useEffect } from 'react'
import { login, getToken } from './services/auth'
import { api } from './services/api'

function App() {
  useEffect(() => {
    async function testar() {
      try {
        await login('joao@email.com', 'SENHA_DO_JOAO')

        const token = getToken()

        const usuario = await api('/auth/me', {
          token: token ?? undefined,
        })

        console.log('Usuário autenticado:', usuario)
      } catch (error) {
        console.error('Erro:', error)
      }
    }

    testar()
  }, [])

  return <h1>Teste de autenticação</h1>
}

export default App