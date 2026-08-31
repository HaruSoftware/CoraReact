import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiSettings,
  FiUser,
  FiUsers,
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './SettingsPage.css'

type Usuario = {
  id_usuario: number
  id_conta: number
  nome: string
  email: string
}

function SettingsPage() {
  const navigate = useNavigate()
  const { usuario: usuarioLogado, logout } = useAuth()
  const { toast } = useToast()

  // Estados da Conta
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [nomeOriginal, setNomeOriginal] = useState('')
  const [emailOriginal, setEmailOriginal] = useState('')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Estados dos Usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)

  // Estados dos Modais de Usuário
  const [modalNovoUsuarioAberto, setModalNovoUsuarioAberto] = useState(false)
  const [modalEditarUsuarioAberto, setModalEditarUsuarioAberto] = useState(false)
  const [modalExcluirUsuarioAberto, setModalExcluirUsuarioAberto] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)

  // Formulário Novo Usuário
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  // Formulário Editar Usuário
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSenha, setEditSenha] = useState('')

  // Modal Excluir Conta
  const [modalExcluirContaAberto, setModalExcluirContaAberto] = useState(false)
  const [confirmacaoExcluirConta, setConfirmacaoExcluirConta] = useState('')
  const [excluindoConta, setExcluindoConta] = useState(false)

  async function carregarDados() {
    try {
      setCarregandoUsuarios(true)
      const [contaData, usuariosData] = await Promise.all([
        api('/contas/me'),
        api('/usuarios'),
      ])

      setNome(contaData.conta.nome)
      setEmail(contaData.conta.email)
      setNomeOriginal(contaData.conta.nome)
      setEmailOriginal(contaData.conta.email)

      setUsuarios(Array.isArray(usuariosData) ? usuariosData : [])
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar dados da conta e usuários.')
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Salvar dados da Conta
  async function salvarConta() {
    if (!nome.trim() || !email.trim()) {
      toast.warning('Nome da empresa e e-mail são obrigatórios.')
      return
    }

    try {
      setSalvando(true)

      await api('/contas/me', {
        method: 'PUT',
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
        }),
      })

      setNomeOriginal(nome.trim())
      setEmailOriginal(email.trim())
      setEditando(false)
      toast.success('Informações da empresa atualizadas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar conta:', error)
      toast.error(error.message || 'Erro ao atualizar dados da conta.')
    } finally {
      setSalvando(false)
    }
  }

  // Criar Usuário
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault()

    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha) {
      toast.warning('Preencha todos os campos para criar o usuário.')
      return
    }

    try {
      setSalvandoUsuario(true)

      const novoUsuario = await api('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nome: novoNome.trim(),
          email: novoEmail.trim(),
          senha: novaSenha,
        }),
      })

      setUsuarios((prev) => [...prev, novoUsuario])
      setModalNovoUsuarioAberto(false)
      setNovoNome('')
      setNovoEmail('')
      setNovaSenha('')
      toast.success('Novo usuário adicionado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast.error(error.message || 'Erro ao criar usuário.')
    } finally {
      setSalvandoUsuario(false)
    }
  }

  // Abrir Modal de Edição de Usuário
  function abrirModalEditar(u: Usuario) {
    setUsuarioSelecionado(u)
    setEditNome(u.nome)
    setEditEmail(u.email)
    setEditSenha('')
    setModalEditarUsuarioAberto(true)
  }

  // Salvar Edição de Usuário
  async function handleSalvarEdicaoUsuario(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioSelecionado) return

    if (!editNome.trim() || !editEmail.trim()) {
      toast.warning('Nome e e-mail são obrigatórios.')
      return
    }

    try {
      setSalvandoUsuario(true)

      const payload: { nome: string; email: string; senha?: string } = {
        nome: editNome.trim(),
        email: editEmail.trim(),
      }

      if (editSenha.trim()) {
        payload.senha = editSenha
      }

      const usuarioAtualizado = await api(`/usuarios/${usuarioSelecionado.id_usuario}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === usuarioAtualizado.id_usuario ? usuarioAtualizado : u))
      )
      setModalEditarUsuarioAberto(false)
      setUsuarioSelecionado(null)
      toast.success('Dados do usuário atualizados com sucesso!')
    } catch (error: any) {
      console.error('Erro ao editar usuário:', error)
      toast.error(error.message || 'Erro ao atualizar usuário.')
    } finally {
      setSalvandoUsuario(false)
    }
  }

  // Abrir Modal de Confirmação de Exclusão de Usuário
  function abrirModalExcluirUsuario(u: Usuario) {
    setUsuarioSelecionado(u)
    setModalExcluirUsuarioAberto(true)
  }

  // Confirmar Exclusão de Usuário
  async function handleExcluirUsuario() {
    if (!usuarioSelecionado) return

    try {
      setSalvandoUsuario(true)

      await api(`/usuarios/${usuarioSelecionado.id_usuario}`, {
        method: 'DELETE',
      })

      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== usuarioSelecionado.id_usuario))
      setModalExcluirUsuarioAberto(false)
      setUsuarioSelecionado(null)
      toast.success('Usuário removido com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      toast.error(error.message || 'Erro ao excluir usuário.')
    } finally {
      setSalvandoUsuario(false)
    }
  }

  // Excluir Conta
  async function handleExcluirConta() {
    if (confirmacaoExcluirConta.toUpperCase() !== 'EXCLUIR') {
      toast.warning('Digite EXCLUIR exatamente para confirmar.')
      return
    }

    try {
      setExcluindoConta(true)

      await api('/contas/me', {
        method: 'DELETE',
      })

      toast.info('Conta excluída com sucesso.')
      setModalExcluirContaAberto(false)
      await logout()
      navigate('/login')
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      toast.error(error.message || 'Erro ao excluir conta.')
    } finally {
      setExcluindoConta(false)
    }
  }

  return (
    <main className="settings-page">
      {/* CABEÇALHO */}
      <header className="settings-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          title="Voltar ao Painel"
        >
          <FiArrowLeft />
        </button>

        <div>
          <span className="settings-header-label">Administração</span>
          <h1>Configurações</h1>
        </div>
      </header>

      <div className="settings-content">
        {/* SEÇÃO: MINHA CONTA */}
        <section className="settings-section">
          <div className="section-heading">
            <div className="section-icon">
              <FiSettings />
            </div>
            <div>
              <h2>Minha conta</h2>
              <p>Gerencie as informações da sua empresa.</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="info-row">
              <div>
                <span>Nome da empresa</span>
                {editando ? (
                  <input
                    className="settings-input"
                    type="text"
                    placeholder="Ex: Minha Empresa Ltda"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                  />
                ) : (
                  <strong>{nome || 'Não informado'}</strong>
                )}
              </div>
            </div>

            <div className="info-row">
              <div>
                <span>E-mail da empresa</span>
                {editando ? (
                  <input
                    className="settings-input"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                ) : (
                  <strong>{email || 'Não informado'}</strong>
                )}
              </div>
            </div>

            <div className="info-row">
              <div>
                <span>Identificação da conta</span>
                <strong>#{usuarioLogado?.id_conta}</strong>
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
                  type="button"
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
                  type="button"
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

        {/* SEÇÃO: USUÁRIOS */}
        <section className="settings-section">
          <div className="section-heading-with-action">
            <div className="section-heading">
              <div className="section-icon">
                <FiUsers />
              </div>
              <div>
                <h2>Usuários da conta</h2>
                <p>Gerencie as pessoas que possuem acesso à conta.</p>
              </div>
            </div>

            <button
              className="primary-button add-user-header-btn"
              onClick={() => setModalNovoUsuarioAberto(true)}
            >
              <FiPlus /> Adicionar usuário
            </button>
          </div>

          <div className="settings-card users-card">
            {carregandoUsuarios ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Carregando usuários...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="users-empty">
                <div className="empty-users-icon">
                  <FiUser />
                </div>
                <strong>Nenhum usuário cadastrado</strong>
                <p>Adicione membros à sua equipe para colaborarem no sistema.</p>
                <button
                  className="primary-button"
                  onClick={() => setModalNovoUsuarioAberto(true)}
                >
                  <FiPlus /> Adicionar primeiro usuário
                </button>
              </div>
            ) : (
              <div className="users-list">
                {usuarios.map((u) => {
                  const ehUsuarioLogado = u.id_usuario === usuarioLogado?.id_usuario
                  const inicial = u.nome ? u.nome.charAt(0).toUpperCase() : '?'

                  return (
                    <div key={u.id_usuario} className="user-item">
                      <div className="user-item-left">
                        <div className="user-avatar">
                          {inicial}
                        </div>
                        <div className="user-info">
                          <div className="user-name-wrapper">
                            <strong>{u.nome}</strong>
                            {ehUsuarioLogado && (
                              <span className="user-badge-current">Você</span>
                            )}
                          </div>
                          <span>{u.email}</span>
                        </div>
                      </div>

                      <div className="user-actions">
                        <button
                          className="user-action-button"
                          title="Editar usuário"
                          onClick={() => abrirModalEditar(u)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="user-action-button delete"
                          title={ehUsuarioLogado ? 'Não é possível excluir seu próprio usuário' : 'Excluir usuário'}
                          disabled={ehUsuarioLogado}
                          onClick={() => abrirModalExcluirUsuario(u)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* SEÇÃO: ZONA DE PERIGO */}
        <section className="settings-section danger-section">
          <div className="section-heading">
            <div className="section-icon danger-icon">
              <FiAlertTriangle />
            </div>
            <div>
              <h2>Zona de perigo</h2>
              <p>Ações permanentes que afetam toda a conta.</p>
            </div>
          </div>

          <div className="danger-card">
            <div>
              <strong>Excluir conta</strong>
              <p>Exclui permanentemente a conta e todos os dados associados a ela.</p>
            </div>

            <button
              className="danger-button"
              onClick={() => {
                setConfirmacaoExcluirConta('')
                setModalExcluirContaAberto(true)
              }}
            >
              Excluir conta
            </button>
          </div>
        </section>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {modalNovoUsuarioAberto && (
        <div className="modal-overlay" onClick={() => setModalNovoUsuarioAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon">
                  <FiUser />
                </div>
                <div>
                  <h3>Adicionar Usuário</h3>
                  <p>Cadastre um novo usuário com acesso à sua conta.</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setModalNovoUsuarioAberto(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="user-form">
              <div className="user-form-group">
                <label>Nome completo</label>
                <input
                  type="text"
                  placeholder="Nome do colaborador"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="user-form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="colaborador@empresa.com"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  required
                />
              </div>

              <div className="user-form-group">
                <label>Senha provisória</label>
                <input
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  minLength={4}
                />
              </div>

              <div className="user-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalNovoUsuarioAberto(false)}
                  disabled={salvandoUsuario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={salvandoUsuario}
                >
                  {salvandoUsuario ? 'Salvando...' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {modalEditarUsuarioAberto && usuarioSelecionado && (
        <div className="modal-overlay" onClick={() => setModalEditarUsuarioAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon">
                  <FiEdit2 />
                </div>
                <div>
                  <h3>Editar Usuário</h3>
                  <p>Atualize os dados de {usuarioSelecionado.nome}.</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setModalEditarUsuarioAberto(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoUsuario} className="user-form">
              <div className="user-form-group">
                <label>Nome completo</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="user-form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="user-form-group">
                <label>Nova senha (deixe em branco para manter a atual)</label>
                <input
                  type="password"
                  placeholder="Nova senha (opcional)"
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                />
              </div>

              <div className="user-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalEditarUsuarioAberto(false)}
                  disabled={salvandoUsuario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={salvandoUsuario}
                >
                  {salvandoUsuario ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR USUÁRIO */}
      {modalExcluirUsuarioAberto && usuarioSelecionado && (
        <div className="modal-overlay" onClick={() => setModalExcluirUsuarioAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon danger-icon">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3>Excluir Usuário</h3>
                  <p>Tem certeza de que deseja remover este usuário?</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setModalExcluirUsuarioAberto(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-text">
              <p>
                O usuário <strong>{usuarioSelecionado.nome}</strong> (
                {usuarioSelecionado.email}) perderá imediatamente o acesso ao sistema.
              </p>
            </div>

            <div className="user-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModalExcluirUsuarioAberto(false)}
                disabled={salvandoUsuario}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button filled"
                onClick={handleExcluirUsuario}
                disabled={salvandoUsuario}
              >
                {salvandoUsuario ? 'Excluindo...' : 'Excluir usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR CONTA */}
      {modalExcluirContaAberto && (
        <div className="modal-overlay" onClick={() => setModalExcluirContaAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon danger-icon">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3>Excluir Conta Permanentemente</h3>
                  <p>Esta ação é irreversível.</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setModalExcluirContaAberto(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-text">
              <p>
                Todos os produtos, clientes, vendas, categorias e usuários vinculados a
                esta conta serão <strong>permanentemente excluídos</strong>.
              </p>
              <p className="danger-instruction">
                Para confirmar a exclusão definitiva, digite <strong>EXCLUIR</strong> no
                campo abaixo:
              </p>

              <input
                type="text"
                className="settings-input danger-confirm-input"
                placeholder="Digite EXCLUIR"
                value={confirmacaoExcluirConta}
                onChange={(e) => setConfirmacaoExcluirConta(e.target.value)}
                autoFocus
              />
            </div>

            <div className="user-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModalExcluirContaAberto(false)}
                disabled={excluindoConta}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button filled"
                onClick={handleExcluirConta}
                disabled={
                  confirmacaoExcluirConta.toUpperCase() !== 'EXCLUIR' || excluindoConta
                }
              >
                {excluindoConta ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default SettingsPage