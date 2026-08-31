import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSettings, FiUser, FiUsers, FiAlertTriangle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import './SettingsPage.css'

function SettingsPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  type Usuario = {
    id_usuario: number
    id_conta: number
    nome: string
    email: string
  }

  const [nomeOriginal, setNomeOriginal] = useState('')
  const [emailOriginal, setEmailOriginal] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      try {
        const contaData = await api('/contas/me')

        setNome(contaData.conta.nome)
        setEmail(contaData.conta.email)

        setNomeOriginal(contaData.conta.nome)
        setEmailOriginal(contaData.conta.email)

        const usuariosData = await api('/usuarios')

        setUsuarios(usuariosData)
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setCarregandoUsuarios(false)
      }
    }

    carregarDados()
  }, [])

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
                  Nome da empresa
                </span>

                {editando ? (
                  <input
                    className="settings-input"
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                  />
                ) : (
                  <strong>
                    {nome}
                  </strong>
                )}
              </div>
            </div>


            <div className="info-row">
              <div>
                <span>
                  E-mail
                </span>

                {editando ? (
                  <input
                    className="settings-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                ) : (
                  <strong>
                    {email}
                  </strong>
                )}
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


            {!editando ? (
              <button
                className="secondary-button"
                onClick={() => setEditando(true)}
              >
                Editar informações
              </button>
            ) : (
              <div className="settings-actions">

                <button
                  className="secondary-button"
                  onClick={() => {
                    setNome(nomeOriginal)
                    setEmail(emailOriginal)
                    setEditando(false)
                  }}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  className="primary-button"
                  onClick={salvarConta}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>

              </div>
            )}

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

  async function salvarConta() {
    try {
      setSalvando(true)

      await api('/contas/me', {
        method: 'PUT',
        body: JSON.stringify({
          nome,
          email,
        }),
      })

      setEditando(false)
    } catch (error) {
      console.error('Erro ao atualizar conta:', error)
    } finally {
      setSalvando(false)
    }
  }
}

export default SettingsPage