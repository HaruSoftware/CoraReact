import { useState } from 'react'
import { useAuth } from '../contexts/authContext'

function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()

    setErro('')
    setCarregando(true)

    try {
      await login(email, senha)

      console.log('Login realizado com sucesso!')
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message)
      } else {
        setErro('Erro ao realizar login.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="senha">Senha</label>

          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
          />
        </div>

        {erro && <p>{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
