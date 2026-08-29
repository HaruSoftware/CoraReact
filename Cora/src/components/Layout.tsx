import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

function Layout() {
  const { usuario, logout } = useAuth()

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <h1>Cora</h1>
          <span>Gestão do seu negócio</span>
        </div>

        <nav className="sidebar-nav">

          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>▣</span>
            Produtos
          </button>

          <button className="nav-item">
            <span>◈</span>
            Categorias
          </button>

          <button className="nav-item">
            <span>♙</span>
            Clientes
          </button>

          <button className="nav-item">
            <span>▤</span>
            Vendas
          </button>

          <button className="nav-item">
            <span>♟</span>
            Usuários
          </button>

        </nav>

        <div className="sidebar-footer">
          <span className="account-label">
            Conta
          </span>

          <strong>
            #{usuario?.id_conta}
          </strong>
        </div>

      </aside>


      {/* ÁREA PRINCIPAL */}
      <div className="main-area">

        {/* HEADER */}
        <header className="topbar">

          <div>
            <span className="topbar-label">
              Painel administrativo
            </span>

            <h2>
              Dashboard
            </h2>
          </div>

          <div className="user-area">

            <div className="user-info">
              <strong>
                {usuario?.nome}
              </strong>

              <span>
                {usuario?.email}
              </span>
            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              Sair
            </button>

          </div>

        </header>


        {/* CONTEÚDO */}
        <main className="dashboard">

          <section className="welcome-section">

            <div>
              <span className="welcome-label">
                Visão geral
              </span>

              <h1>
                Olá, {usuario?.nome}! 👋
              </h1>

              <p>
                Acompanhe o desempenho do seu negócio
                através do painel.
              </p>
            </div>

          </section>


          {/* CARDS */}
          <section className="stats-grid">

            <article className="stat-card">

              <div className="stat-icon">
                📦
              </div>

              <div>
                <span>
                  Produtos
                </span>

                <strong>
                  0
                </strong>
              </div>

            </article>


            <article className="stat-card">

              <div className="stat-icon">
                👥
              </div>

              <div>
                <span>
                  Clientes
                </span>

                <strong>
                  0
                </strong>
              </div>

            </article>


            <article className="stat-card">

              <div className="stat-icon">
                🛒
              </div>

              <div>
                <span>
                  Vendas
                </span>

                <strong>
                  0
                </strong>
              </div>

            </article>


            <article className="stat-card">

              <div className="stat-icon">
                💰
              </div>

              <div>
                <span>
                  Faturamento
                </span>

                <strong>
                  R$ 0,00
                </strong>
              </div>

            </article>

          </section>


          {/* CONTEÚDO INFERIOR */}
          <section className="dashboard-grid">

            <article className="dashboard-card sales-card">

              <div className="card-header">

                <div>
                  <span>
                    Desempenho
                  </span>

                  <h3>
                    Vendas recentes
                  </h3>
                </div>

                <span className="card-period">
                  Este mês
                </span>

              </div>

              <div className="empty-state">

                <div className="empty-icon">
                  📊
                </div>

                <strong>
                  Nenhuma venda registrada
                </strong>

                <p>
                  As vendas realizadas aparecerão
                  aqui.
                </p>

              </div>

            </article>


            <article className="dashboard-card activity-card">

              <div className="card-header">

                <div>
                  <span>
                    Sistema
                  </span>

                  <h3>
                    Atividade recente
                  </h3>
                </div>

              </div>

              <div className="empty-state">

                <div className="empty-icon">
                  ◷
                </div>

                <strong>
                  Nenhuma atividade
                </strong>

                <p>
                  Suas atividades recentes aparecerão
                  aqui.
                </p>

              </div>

            </article>

          </section>

        </main>

      </div>

    </div>
  )
}

export default Layout
