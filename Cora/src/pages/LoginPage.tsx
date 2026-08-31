import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'
import { FcGoogle } from 'react-icons/fc'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

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
    <main className="login-page">
      <section className="login-card">

        <div className="login-header">
          <h1>Cora</h1>

          <p>
            Gestão eficiente para o seu negócio.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          <div className="input-group">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {erro && (
            <div className="login-error">
              {erro}
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            className="google-button"
            onClick={() => {
              window.location.href = 'http://localhost:3000/api/auth/google'
            }}
          >
            <FcGoogle className="google-icon" />
            Continuar com Google
          </button>

        </form>

        <div className="login-footer">
          <span>
            Ainda não possui uma conta?
          </span>

          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            Criar conta
          </button>
        </div>

      </section>
    </main>
  )
}

export default LoginPage
