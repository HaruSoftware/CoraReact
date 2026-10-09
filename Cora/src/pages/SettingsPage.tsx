import { useEffect, useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
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
  FiBox,
  FiMail,
} from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, urlDaApi } from '../services/api'
import { useAuth } from '../contexts/AuthContextValue'
import { useToast } from '../contexts/ToastContextValue'
import './SettingsPage.css'

type Usuario = {
  id_usuario: number
  id_conta: number
  nome: string
  email: string
  conta_google: boolean
  conta_senha: boolean
}

type UnidadeMedida = {
  id_unidade_medida: number
  codigo: string
  nome: string
  ativo: boolean
}

type Assinatura = {
  nome: string
  status: string
  periodicidade: string
  valor_mensal: string | number
  data_fim_periodo: string
  demonstrativo: boolean
}

type AreaDados = 'clientes' | 'vendas' | 'produtos' | 'categorias'

const areasDeDados: Record<AreaDados, { titulo: string; descricao: string }> = {
  clientes: {
    titulo: 'Clientes',
    descricao: 'Remove todos os clientes cadastrados. Clientes vinculados a vendas exigem que as vendas sejam limpas primeiro.',
  },
  vendas: {
    titulo: 'Vendas',
    descricao: 'Remove todas as vendas e seus itens associados, preservando clientes e produtos.',
  },
  produtos: {
    titulo: 'Produtos',
    descricao: 'Remove todos os produtos cadastrados. Produtos presentes em vendas exigem que as vendas sejam limpas primeiro.',
  },
  categorias: {
    titulo: 'Categorias',
    descricao: 'Remove todas as categorias. Para evitar apagar produtos associados sem aviso, limpe os produtos primeiro.',
  },
}

function mensagemDoErro(error: unknown, mensagemPadrao: string) {
  return error instanceof Error ? error.message : mensagemPadrao
}

function SettingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { usuario: usuarioLogado, logout } = useAuth()
  const { toast } = useToast()

  // Estados da Conta
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [nomeOriginal, setNomeOriginal] = useState('')
  const [emailOriginal, setEmailOriginal] = useState('')
  const [idUsuarioCriador, setIdUsuarioCriador] = useState<number | null>(null)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Estados dos Usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [novoCodigoUnidade, setNovoCodigoUnidade] = useState('')
  const [novoNomeUnidade, setNovoNomeUnidade] = useState('')
  const [salvandoUnidade, setSalvandoUnidade] = useState(false)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [carregandoAssinatura, setCarregandoAssinatura] = useState(true)

  // Estados dos Modais de Usuário
  const [modalNovoUsuarioAberto, setModalNovoUsuarioAberto] = useState(false)
  const [modalEditarUsuarioAberto, setModalEditarUsuarioAberto] = useState(false)
  const [modalExcluirUsuarioAberto, setModalExcluirUsuarioAberto] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)

  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const [metodoAcessoNovoUsuario, setMetodoAcessoNovoUsuario] = useState<'senha' | 'google'>('senha')
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  // Formulário Editar Usuário
  const [editNome, setEditNome] = useState('')
  const [editSenha, setEditSenha] = useState('')

  // Modal Excluir Conta
  const [modalExcluirContaAberto, setModalExcluirContaAberto] = useState(false)
  const [confirmacaoExcluirConta, setConfirmacaoExcluirConta] = useState('')
  const [excluindoConta, setExcluindoConta] = useState(false)
  const [areaSelecionada, setAreaSelecionada] = useState<AreaDados | null>(null)
  const [confirmacaoLimpeza, setConfirmacaoLimpeza] = useState('')
  const [limpandoArea, setLimpandoArea] = useState(false)

  useEffect(() => {
    let cancelado = false

    Promise.all([
      api('/contas/me'),
      api('/usuarios'),
      api('/unidades-medida'),
      api('/assinaturas/me'),
    ])
      .then(([contaData, usuariosData, unidadesData, assinaturaData]) => {
        if (cancelado) return

        setNome(contaData.conta.nome)
        setEmail(contaData.conta.email)
        setNomeOriginal(contaData.conta.nome)
        setEmailOriginal(contaData.conta.email)
        setIdUsuarioCriador(contaData.conta.id_usuario_criador)
        setUsuarios(Array.isArray(usuariosData) ? usuariosData : [])
        setUnidades(Array.isArray(unidadesData) ? unidadesData : [])
        setAssinatura(assinaturaData.assinatura)
      })
      .catch((error: unknown) => {
        if (cancelado) return

        console.error('Erro ao carregar configurações:', error)
        toast.error('Erro ao carregar dados da conta e usuários.')
      })
      .finally(() => {
        if (cancelado) return

        setCarregandoUsuarios(false)
        setCarregandoAssinatura(false)
      })

    return () => {
      cancelado = true
    }
  }, [toast])

  useEffect(() => {
    const statusGoogle = searchParams.get('google_user')
    if (!statusGoogle) return

    if (statusGoogle === 'added') {
      toast.success('Conta Google adicionada à sua equipe.')
    } else if (statusGoogle === 'linked') {
      toast.success('Conta Google vinculada ao usuário existente.')
    } else if (statusGoogle === 'exists') {
      toast.info('Esta conta Google já pertence à sua equipe.')
    } else if (statusGoogle === 'conflict') {
      toast.error('Este e-mail ou conta Google já está associado a outra conta.')
    } else {
      toast.error('Não foi possível adicionar a conta Google.')
    }

    const parametrosAtualizados = new URLSearchParams(searchParams)
    parametrosAtualizados.delete('google_user')
    setSearchParams(parametrosAtualizados, { replace: true })
  }, [searchParams, setSearchParams, toast])

  async function criarUnidade() {
    if (!novoCodigoUnidade.trim() || !novoNomeUnidade.trim()) {
      toast.warning('Informe o código e o nome da unidade.')
      return
    }

    try {
      setSalvandoUnidade(true)
      const unidade = await api('/unidades-medida', {
        method: 'POST',
        body: JSON.stringify({ codigo: novoCodigoUnidade, nome: novoNomeUnidade }),
      })
      setUnidades((atuais) => [...atuais, unidade].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.codigo.localeCompare(b.codigo)))
      setNovoCodigoUnidade('')
      setNovoNomeUnidade('')
      toast.success('Unidade de medida adicionada.')
    } catch (error: unknown) {
      toast.error(mensagemDoErro(error, 'Não foi possível adicionar a unidade.'))
    } finally {
      setSalvandoUnidade(false)
    }
  }

  async function alternarUnidade(unidade: UnidadeMedida) {
    try {
      const atualizada = await api(`/unidades-medida/${unidade.id_unidade_medida}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !unidade.ativo }),
      })
      setUnidades((atuais) => atuais.map((item) => item.id_unidade_medida === atualizada.id_unidade_medida ? atualizada : item))
      toast.success(atualizada.ativo ? 'Unidade liberada para uso.' : 'Unidade bloqueada.')
    } catch (error: unknown) {
      toast.error(mensagemDoErro(error, 'Não foi possível atualizar a unidade.'))
    }
  }

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
    } catch (error: unknown) {
      console.error('Erro ao atualizar conta:', error)
      toast.error(mensagemDoErro(error, 'Erro ao atualizar dados da conta.'))
    } finally {
      setSalvando(false)
    }
  }

  function adicionarUsuarioComGoogle() {
    window.location.href = urlDaApi('/auth/google/link')
  }

  function abrirModalNovoUsuario() {
    setMetodoAcessoNovoUsuario('senha')
    setNovoNome('')
    setNovoEmail('')
    setNovaSenha('')
    setModalNovoUsuarioAberto(true)
  }

  async function handleCriarUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha) {
      toast.warning('Preencha nome, e-mail e senha.')
      return
    }

    try {
      setSalvandoUsuario(true)
      const usuarioCriado = await api('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nome: novoNome.trim(),
          email: novoEmail.trim(),
          senha: novaSenha,
        }),
      })

      setUsuarios((atuais) => [...atuais, usuarioCriado])
      setModalNovoUsuarioAberto(false)
      toast.success('Usuário com e-mail e senha adicionado à equipe.')
    } catch (error: unknown) {
      toast.error(mensagemDoErro(error, 'Não foi possível adicionar o usuário.'))
    } finally {
      setSalvandoUsuario(false)
    }
  }

  // Abrir Modal de Edição de Usuário
  function abrirModalEditar(u: Usuario) {
    setUsuarioSelecionado(u)
    setEditNome(u.nome)
    setEditSenha('')
    setModalEditarUsuarioAberto(true)
  }

  // Salvar Edição de Usuário
  async function handleSalvarEdicaoUsuario(e: React.FormEvent) {
    e.preventDefault()
    if (!usuarioSelecionado) return

    if (!editNome.trim()) {
      toast.warning('Nome é obrigatório.')
      return
    }

    try {
      setSalvandoUsuario(true)

      const payload: { nome: string; senha?: string } = {
        nome: editNome.trim(),
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
    } catch (error: unknown) {
      console.error('Erro ao editar usuário:', error)
      toast.error(mensagemDoErro(error, 'Erro ao atualizar usuário.'))
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
    } catch (error: unknown) {
      console.error('Erro ao excluir usuário:', error)
      toast.error(mensagemDoErro(error, 'Erro ao excluir usuário.'))
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
        body: JSON.stringify({ confirmacao: confirmacaoExcluirConta }),
      })

      toast.info('Conta excluída com sucesso.')
      setModalExcluirContaAberto(false)
      await logout()
      navigate('/login')
    } catch (error: unknown) {
      console.error('Erro ao excluir conta:', error)
      toast.error(mensagemDoErro(error, 'Erro ao excluir conta.'))
    } finally {
      setExcluindoConta(false)
    }
  }

  async function handleLimparArea() {
    if (!areaSelecionada) return

    if (confirmacaoLimpeza.toUpperCase() !== 'EXCLUIR') {
      toast.warning('Digite EXCLUIR exatamente para confirmar.')
      return
    }

    try {
      setLimpandoArea(true)
      const resultado = await api(`/contas/me/dados/${areaSelecionada}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmacao: confirmacaoLimpeza }),
      })
      setAreaSelecionada(null)
      setConfirmacaoLimpeza('')
      toast.success(`${resultado.removidos} registro(s) de ${areasDeDados[areaSelecionada].titulo.toLowerCase()} removido(s).`)
    } catch (error: unknown) {
      toast.error(mensagemDoErro(error, 'Não foi possível limpar os dados desta área.'))
    } finally {
      setLimpandoArea(false)
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

        <section className="settings-section">
          <div className="section-heading">
            <div className="section-icon">
              <FiBox />
            </div>
            <div>
              <h2>Plano e assinatura</h2>
              <p>Consulte o plano ativo nesta conta.</p>
            </div>
          </div>

          <div className="settings-card">
            {carregandoAssinatura ? (
              <div className="loading-state"><p>Carregando assinatura...</p></div>
            ) : assinatura ? (
              <>
                <div className="info-row">
                  <span>Plano</span>
                  <strong>{assinatura.nome}</strong>
                </div>
                <div className="info-row">
                  <span>Valor mensal informado</span>
                  <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(assinatura.valor_mensal))}</strong>
                </div>
                <div className="info-row">
                  <span>Status</span>
                  <strong>{assinatura.status === 'ativa' ? 'Ativo' : assinatura.status}</strong>
                </div>
                <div className="info-row">
                  <span>Fim do período mensal</span>
                  <strong>{new Date(assinatura.data_fim_periodo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</strong>
                </div>
                <p className="subscription-notice">
                  {assinatura.demonstrativo
                    ? 'Plano demonstrativo: nenhum pagamento ou renovação automática será realizado.'
                    : 'A assinatura está ativa. Pagamentos e renovações automáticas ainda não estão habilitados.'}
                </p>
              </>
            ) : (
              <div className="subscription-empty">
                <p>Esta conta ainda não possui um plano ativo.</p>
                <button className="primary-button" onClick={() => navigate('/escolher-plano')}>
                  Escolher plano
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
              onClick={abrirModalNovoUsuario}
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
                  onClick={abrirModalNovoUsuario}
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
                        <div className="settings-user-info">
                          <div className="user-name-wrapper">
                            <strong>{u.nome}</strong>
                            {u.conta_google && (
                              <span className="user-badge-google"><FcGoogle aria-hidden="true" /> Conta Google</span>
                            )}
                            {u.conta_senha && (
                              <span className="user-badge-password"><FiMail aria-hidden="true" /> E-mail e senha</span>
                            )}
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

        {/* SEÇÃO: UNIDADES DE MEDIDA */}
        <section className="settings-section">
          <div className="section-heading">
            <div className="section-icon">
              <FiBox />
            </div>
            <div>
              <h2>Unidades de medida</h2>
              <p>Defina quais unidades podem ser usadas nos produtos.</p>
            </div>
          </div>

          <div className="settings-card units-card">
            <div className="unit-create-form">
              <input
                className="settings-input unit-code-input"
                value={novoCodigoUnidade}
                onChange={(event) => setNovoCodigoUnidade(event.target.value.toUpperCase())}
                placeholder="Código (ex.: CX)"
                maxLength={10}
              />
              <input
                className="settings-input"
                value={novoNomeUnidade}
                onChange={(event) => setNovoNomeUnidade(event.target.value)}
                placeholder="Nome (ex.: Caixa)"
                maxLength={80}
              />
              <button className="primary-button" onClick={criarUnidade} disabled={salvandoUnidade}>
                <FiPlus /> {salvandoUnidade ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>

            <div className="units-list">
              {unidades.map((unidade) => (
                <div className="unit-item" key={unidade.id_unidade_medida}>
                  <div>
                    <strong>{unidade.codigo}</strong>
                    <span>{unidade.nome}</span>
                  </div>
                  <button
                    className={unidade.ativo ? 'unit-toggle active' : 'unit-toggle'}
                    onClick={() => alternarUnidade(unidade)}
                  >
                    {unidade.ativo ? 'Liberada' : 'Bloqueada'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO: ZONA DE PERIGO */}
        {idUsuarioCriador !== null && usuarioLogado?.id_usuario === idUsuarioCriador && (
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

          {(Object.entries(areasDeDados) as [AreaDados, (typeof areasDeDados)[AreaDados]][]).map(([area, dados]) => (
            <div className="danger-card" key={area}>
              <div>
                <strong>Limpar {dados.titulo.toLowerCase()}</strong>
                <p>{dados.descricao}</p>
              </div>
              <button
                className="danger-button"
                onClick={() => {
                  setConfirmacaoLimpeza('')
                  setAreaSelecionada(area)
                }}
              >
                Limpar {dados.titulo.toLowerCase()}
              </button>
            </div>
          ))}

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
        )}
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {modalNovoUsuarioAberto && (
        <div className="modal-overlay" onClick={() => setModalNovoUsuarioAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className={metodoAcessoNovoUsuario === 'google' ? 'modal-icon google-user-modal-icon' : 'modal-icon'}>
                  {metodoAcessoNovoUsuario === 'google' ? <FcGoogle /> : <FiMail />}
                </div>
                <div>
                  <h3>Adicionar usuário</h3>
                  <p>Escolha como essa pessoa vai acessar a conta.</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setModalNovoUsuarioAberto(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="user-method-picker" role="group" aria-label="Método de acesso do usuário">
              <button
                type="button"
                className={metodoAcessoNovoUsuario === 'senha' ? 'user-method-option active' : 'user-method-option'}
                aria-pressed={metodoAcessoNovoUsuario === 'senha'}
                onClick={() => setMetodoAcessoNovoUsuario('senha')}
              >
                <FiMail aria-hidden="true" /> E-mail e senha
              </button>
              <button
                type="button"
                className={metodoAcessoNovoUsuario === 'google' ? 'user-method-option active' : 'user-method-option'}
                aria-pressed={metodoAcessoNovoUsuario === 'google'}
                onClick={() => setMetodoAcessoNovoUsuario('google')}
              >
                <FcGoogle aria-hidden="true" /> Conta Google
              </button>
            </div>

            {metodoAcessoNovoUsuario === 'senha' ? (
              <form onSubmit={handleCriarUsuario} className="user-form">
                <div className="user-form-group">
                  <label htmlFor="new-user-name">Nome completo</label>
                  <input id="new-user-name" type="text" placeholder="Nome do colaborador" value={novoNome} onChange={(event) => setNovoNome(event.target.value)} required autoFocus />
                </div>
                <div className="user-form-group">
                  <label htmlFor="new-user-email">E-mail</label>
                  <input id="new-user-email" type="email" placeholder="colaborador@empresa.com" value={novoEmail} onChange={(event) => setNovoEmail(event.target.value)} required />
                </div>
                <div className="user-form-group">
                  <label htmlFor="new-user-password">Senha provisória</label>
                  <input id="new-user-password" type="password" placeholder="Mínimo 4 caracteres" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} required minLength={4} />
                </div>
                <div className="user-form-actions">
                  <button type="button" className="secondary-button" onClick={() => setModalNovoUsuarioAberto(false)} disabled={salvandoUsuario}>Cancelar</button>
                  <button type="submit" className="primary-button" disabled={salvandoUsuario}>{salvandoUsuario ? 'Salvando...' : 'Criar usuário'}</button>
                </div>
              </form>
            ) : (
              <div className="google-user-invitation">
                <p>A pessoa fará login com a própria conta Google. Não é necessário criar ou compartilhar uma senha.</p>
                <div className="user-form-actions">
                  <button type="button" className="secondary-button" onClick={() => setModalNovoUsuarioAberto(false)}>Cancelar</button>
                  <button type="button" className="primary-button" onClick={adicionarUsuarioComGoogle}>
                    <FcGoogle aria-hidden="true" /> Continuar com Google
                  </button>
                </div>
              </div>
            )}
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
                <label htmlFor="edit-user-email">E-mail cadastrado</label>
                <input id="edit-user-email" type="email" value={usuarioSelecionado.email} readOnly />
                <small className="user-form-hint">Para usar outro e-mail, exclua este usuário e cadastre-o novamente.</small>
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

      {areaSelecionada && (
        <div className="modal-overlay" onClick={() => !limpandoArea && setAreaSelecionada(null)}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon danger-icon">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3>Limpar {areasDeDados[areaSelecionada].titulo.toLowerCase()}</h3>
                  <p>Esta ação é irreversível.</p>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setAreaSelecionada(null)}
                disabled={limpandoArea}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-text">
              <p>{areasDeDados[areaSelecionada].descricao}</p>
              <p>
                Todos os registros desta área serão <strong>permanentemente removidos</strong>.
              </p>
              <p className="danger-instruction">
                Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
              </p>
              <input
                type="text"
                className="settings-input danger-confirm-input"
                placeholder="Digite EXCLUIR"
                value={confirmacaoLimpeza}
                onChange={(event) => setConfirmacaoLimpeza(event.target.value)}
                autoFocus
              />
            </div>

            <div className="user-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAreaSelecionada(null)}
                disabled={limpandoArea}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button filled"
                onClick={handleLimparArea}
                disabled={confirmacaoLimpeza.toUpperCase() !== 'EXCLUIR' || limpandoArea}
              >
                {limpandoArea ? 'Limpando...' : 'Limpar dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default SettingsPage