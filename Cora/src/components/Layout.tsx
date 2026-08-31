import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './Layout.css'
import { useNavigate } from 'react-router-dom'
import { FiSettings, FiLogOut, FiX } from 'react-icons/fi'

function Layout() {
  const { usuario, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)

  async function handleConfirmarLogout() {
    try {
      setSaindo(true)
      await logout()
      toast.info('Você saiu da sua conta.')
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
      toast.error('Erro ao encerrar sessão.')
    } finally {
      setSaindo(false)
      setModalLogoutAberto(false)
    }
  }

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

          <button
            className="nav-item"
            onClick={() => navigate('/settings')}
          >
            <span>♟</span>
            Usuários
          </button>

        </nav>

        <div className="sidebar-footer">
          <div className="account-info">
            <span className="account-label">
              Conta
            </span>

            <strong>
              #{usuario?.id_conta}
            </strong>
          </div>

          <button
            className="settings-button"
            onClick={() => navigate('/settings')}
            title="Configurações"
          >
            <FiSettings />
          </button>
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
              onClick={() => setModalLogoutAberto(true)}
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

      {/* MODAL: CONFIRMAÇÃO DE LOGOUT */}
      {modalLogoutAberto && (
        <div
          className="modal-overlay"
          onClick={() => !saindo && setModalLogoutAberto(false)}
        >
          <div
            className="modal-container logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon logout-icon">
                  <FiLogOut />
                </div>
                <div>
                  <h3>Confirmar saída</h3>
                  <p>Deseja realmente encerrar sua sessão?</p>
                </div>
              </div>

              <button
                className="modal-close-button"
                onClick={() => setModalLogoutAberto(false)}
                disabled={saindo}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-text">
              <p>
                Você precisará informar seu e-mail e senha novamente para acessar o sistema.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-secondary-button"
                onClick={() => setModalLogoutAberto(false)}
                disabled={saindo}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="modal-danger-button"
                onClick={handleConfirmarLogout}
                disabled={saindo}
              >
                {saindo ? 'Saindo...' : 'Sim, sair'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Layout
