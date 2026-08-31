import { FiArrowLeft, FiSettings, FiUser, FiUsers, FiAlertTriangle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './SettingsPage.css'

function SettingsPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  return (
    <main className="settings-page">

      <header className="settings-header">

        <button
          className="back-button"
          onClick={() => navigate('/')}
          title="Voltar"
        >
          <FiArrowLeft />
        </button>

        <div>
          <span className="settings-header-label">
            Administração
          </span>

          <h1>
            Configurações
          </h1>
        </div>

      </header>


      <div className="settings-content">

        {/* CONTA */}

        <section className="settings-section">

          <div className="section-heading">
            <div className="section-icon">
              <FiSettings />
            </div>

            <div>
              <h2>
                Minha conta
              </h2>

              <p>
                Gerencie as informações da sua empresa.
              </p>
            </div>
          </div>


          <div className="settings-card">

            <div className="info-row">
              <div>
                <span>
                  Usuário
                </span>

                <strong>
                  {usuario?.nome}
                </strong>
              </div>
            </div>


            <div className="info-row">
              <div>
                <span>
                  E-mail
                </span>

                <strong>
                  {usuario?.email}
                </strong>
              </div>
            </div>


            <div className="info-row">
              <div>
                <span>
                  Identificação da conta
                </span>

                <strong>
                  #{usuario?.id_conta}
                </strong>
              </div>
            </div>


            <button className="secondary-button">
              Editar informações
            </button>

          </div>

        </section>


        {/* USUÁRIOS */}

        <section className="settings-section">

          <div className="section-heading">

            <div className="section-icon">
              <FiUsers />
            </div>

            <div>
              <h2>
                Usuários
              </h2>

              <p>
                Gerencie as pessoas que possuem acesso à conta.
              </p>
            </div>

          </div>


          <div className="settings-card users-card">

            <div className="users-empty">

              <div className="empty-users-icon">
                <FiUser />
              </div>

              <strong>
                Gerenciar usuários
              </strong>

              <p>
                Em breve você poderá adicionar,
                editar e remover usuários desta conta.
              </p>

              <button className="primary-button">
                Adicionar usuário
              </button>

            </div>

          </div>

        </section>


        {/* ZONA DE PERIGO */}

        <section className="settings-section danger-section">

          <div className="section-heading">

            <div className="section-icon danger-icon">
              <FiAlertTriangle />
            </div>

            <div>
              <h2>
                Zona de perigo
              </h2>

              <p>
                Ações permanentes que afetam toda a conta.
              </p>
            </div>

          </div>


          <div className="danger-card">

            <div>
              <strong>
                Excluir conta
              </strong>

              <p>
                Exclui permanentemente a conta e todos
                os dados associados a ela.
              </p>
            </div>

            <button className="danger-button">
              Excluir conta
            </button>

          </div>

        </section>

      </div>

    </main>
  )
}

export default SettingsPage