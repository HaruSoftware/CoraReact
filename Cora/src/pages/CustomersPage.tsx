import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiSliders,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import './CustomersPage.css'

type Cliente = {
  id_cliente: number
  id_conta: number
  nome: string
  cpf: string
  telefone: string | null
  email: string | null
}

type ClienteForm = {
  nome: string
  cpf: string
  telefone: string
  email: string
}

type CampoFiltro = 'todos' | 'nome' | 'cpf' | 'telefone' | 'email'

const formularioInicial: ClienteForm = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
}

function CustomersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [campoFiltro, setCampoFiltro] = useState<CampoFiltro>('todos')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [formulario, setFormulario] = useState<ClienteForm>(formularioInicial)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [clienteExcluindo, setClienteExcluindo] = useState<Cliente | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    async function carregarClientes() {
      try {
        setCarregando(true)
        const dados = await api('/clientes')
        setClientes(Array.isArray(dados) ? dados : [])
      } catch (error: unknown) {
        console.error('Erro ao carregar clientes:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar clientes.')
      } finally {
        setCarregando(false)
      }
    }

    carregarClientes()
  }, [toast])

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes

    const valores = (cliente: Cliente) => campoFiltro === 'todos'
      ? [cliente.nome, cliente.cpf, cliente.telefone, cliente.email]
      : [cliente[campoFiltro]]

    return clientes.filter((cliente) => valores(cliente)
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(termo)))
  }, [busca, campoFiltro, clientes])

  const existemFiltros = Boolean(busca || campoFiltro !== 'todos')

  function abrirCriacao() {
    setClienteEditando(null)
    setFormulario(formularioInicial)
    setModalAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente)
    setFormulario({
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
    })
    setModalAberto(true)
  }

  function fecharModal(forcar = false) {
    if (salvando && !forcar) return
    setModalAberto(false)
    setClienteEditando(null)
    setFormulario(formularioInicial)
  }

  function atualizarCampo(campo: keyof ClienteForm, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function limparFiltros() {
    setBusca('')
    setCampoFiltro('todos')
  }

  async function salvarCliente(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nome = formulario.nome.trim()
    const cpf = formulario.cpf.trim()

    if (!nome || !cpf) {
      toast.warning('Informe nome e CPF do cliente.')
      return
    }

    try {
      setSalvando(true)
      const clienteSalvo = await api(
        clienteEditando ? `/clientes/${clienteEditando.id_cliente}` : '/clientes',
        {
          method: clienteEditando ? 'PUT' : 'POST',
          body: JSON.stringify({
            nome,
            cpf,
            telefone: formulario.telefone.trim() || null,
            email: formulario.email.trim() || null,
          }),
        }
      )

      setClientes((atuais) => clienteEditando
        ? atuais.map((cliente) => cliente.id_cliente === clienteEditando.id_cliente ? clienteSalvo : cliente)
        : [...atuais, clienteSalvo])
      fecharModal(true)
      toast.success(clienteEditando ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!clienteExcluindo) return

    try {
      setExcluindo(true)
      await api(`/clientes/${clienteExcluindo.id_cliente}`, { method: 'DELETE' })
      setClientes((atuais) => atuais.filter((cliente) => cliente.id_cliente !== clienteExcluindo.id_cliente))
      setClienteExcluindo(null)
      toast.success('Cliente excluído com sucesso!')
    } catch (error: unknown) {
      console.error('Erro ao excluir cliente:', error)
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o cliente.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="customers-page">
      <header className="customers-header">
        <button className="customers-back-button" onClick={() => navigate('/')} title="Voltar ao painel">
          <FiArrowLeft />
        </button>
        <div>
          <span className="customers-eyebrow">Relacionamento</span>
          <h1>Clientes</h1>
          <p>Mantenha os contatos do seu negócio organizados.</p>
        </div>
        <button className="customers-primary-button" onClick={abrirCriacao}>
          <FiPlus /> Novo cliente
        </button>
      </header>

      <main className="customers-content">
        <section className="customers-toolbar">
          <div className="customers-count">
            <strong>{clientes.length}</strong>
            <span>{clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}</span>
          </div>
          <div className="customers-search-controls">
            <label className="customers-search">
              <FiSearch />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar cliente"
                aria-label="Buscar cliente"
              />
            </label>
            <button
              type="button"
              className={filtrosAbertos || campoFiltro !== 'todos' ? 'customers-filter-button active' : 'customers-filter-button'}
              onClick={() => setFiltrosAbertos((aberto) => !aberto)}
              aria-expanded={filtrosAbertos}
            >
              <FiSliders /> Filtros{campoFiltro !== 'todos' && ' (1)'}
            </button>
          </div>
        </section>

        {filtrosAbertos && (
          <section className="customers-filters" aria-label="Filtros de clientes">
            <span className="customers-filter-select-wrap">
              <select value={campoFiltro} onChange={(event) => setCampoFiltro(event.target.value as CampoFiltro)} aria-label="Filtrar por campo">
                <option value="todos">Todos os campos</option>
                <option value="nome">Nome</option>
                <option value="cpf">CPF</option>
                <option value="telefone">Telefone</option>
                <option value="email">E-mail</option>
              </select>
            </span>
            {existemFiltros && <button className="customers-clear-filters" onClick={limparFiltros}>Limpar filtros</button>}
          </section>
        )}

        {carregando ? (
          <div className="customers-state"><div className="customers-spinner" /><span>Carregando clientes...</span></div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="customers-state">
            <div className="customers-empty-icon"><FiUser /></div>
            <strong>{existemFiltros ? 'Nenhum cliente encontrado' : 'Sua carteira ainda está vazia'}</strong>
            <p>{existemFiltros ? 'Ajuste os filtros para encontrar outros clientes.' : 'Cadastre clientes para agilizar o registro das suas vendas.'}</p>
            {!existemFiltros && <button className="customers-primary-button" onClick={abrirCriacao}><FiPlus /> Cadastrar cliente</button>}
          </div>
        ) : (
          <section className="customers-list">
            {clientesFiltrados.map((cliente) => (
              <article className="customer-row" key={cliente.id_cliente}>
                <div className="customer-row-main">
                  <div className="customer-icon"><FiUser /></div>
                  <div>
                    <strong>{cliente.nome}</strong>
                    <span>{cliente.cpf}{cliente.telefone ? ` • ${cliente.telefone}` : ''}</span>
                  </div>
                </div>
                <div className="customer-contact">{cliente.email || 'Sem e-mail cadastrado'}</div>
                <span className="customer-sales" title="Extrato de vendas em breve">0 vendas encontradas</span>
                <div className="customer-actions">
                  <button className="customer-action-button" onClick={() => abrirEdicao(cliente)} title={`Editar ${cliente.nome}`}><FiEdit2 /></button>
                  <button className="customer-action-button delete" onClick={() => setClienteExcluindo(cliente)} title={`Excluir ${cliente.nome}`}><FiTrash2 /></button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {modalAberto && (
        <div className="customers-modal-overlay" onClick={() => fecharModal()}>
          <form className="customers-modal" onSubmit={salvarCliente} onClick={(event) => event.stopPropagation()}>
            <div className="customers-modal-header">
              <div>
                <span className="customers-eyebrow">Relacionamento</span>
                <h2>{clienteEditando ? 'Editar cliente' : 'Cadastrar cliente'}</h2>
              </div>
              <button type="button" className="customers-close-button" onClick={() => fecharModal()} disabled={salvando} title="Fechar"><FiX /></button>
            </div>
            <div className="customer-form-grid">
              <label>Nome completo<input autoFocus value={formulario.nome} onChange={(event) => atualizarCampo('nome', event.target.value)} maxLength={150} required /></label>
              <label>CPF<input value={formulario.cpf} onChange={(event) => atualizarCampo('cpf', event.target.value)} maxLength={20} required /></label>
              <label>Telefone<input value={formulario.telefone} onChange={(event) => atualizarCampo('telefone', event.target.value)} maxLength={30} /></label>
              <label>E-mail<input type="email" value={formulario.email} onChange={(event) => atualizarCampo('email', event.target.value)} maxLength={150} /></label>
            </div>
            <div className="customers-form-actions">
              <button type="button" className="customers-secondary-button" onClick={() => fecharModal()} disabled={salvando}>Cancelar</button>
              <button type="submit" className="customers-primary-button" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar cliente'}</button>
            </div>
          </form>
        </div>
      )}

      {clienteExcluindo && (
        <div className="customers-modal-overlay" onClick={() => !excluindo && setClienteExcluindo(null)}>
          <div className="customers-modal customers-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customers-modal-header">
              <div><span className="customers-eyebrow">Atenção</span><h2>Excluir cliente?</h2></div>
              <button className="customers-close-button" onClick={() => setClienteExcluindo(null)} disabled={excluindo} title="Fechar"><FiX /></button>
            </div>
            <p>Você está prestes a excluir <strong>{clienteExcluindo.nome}</strong>. Vendas vinculadas podem impedir esta exclusão.</p>
            <div className="customers-form-actions">
              <button className="customers-secondary-button" onClick={() => setClienteExcluindo(null)} disabled={excluindo}>Cancelar</button>
              <button className="customers-danger-button" onClick={confirmarExclusao} disabled={excluindo}>{excluindo ? 'Excluindo...' : 'Excluir cliente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
