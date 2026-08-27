import { useAuth } from '../contexts/authContext'

function Layout() {
  const { usuario, logout } = useAuth()

  return (

    <div>
      <header>
        <h1>Cora</h1>

        <div>
          <span>
            Usuário: {usuario?.nome}
          </span>

          <span>
            Conta: {usuario?.id_conta}
          </span>

          <button onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <h2>Dashboard</h2>

        <p>
          Bem-vindo ao sistema, {usuario?.nome}!
        </p>
      </main>
    </div>
  )
}

export default Layout