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
  tipo_pessoa: 'PF' | 'PJ'
  documento: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  desconto_percentual: number | string
}

type ClienteForm = {
  nome: string
  tipo_pessoa: 'PF' | 'PJ'
  documento: string
  telefone: string
  email: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  desconto_percentual: string
}

type CampoFiltro = 'todos' | 'nome' | 'documento' | 'telefone' | 'email'

const formularioInicial: ClienteForm = {
  nome: '',
  tipo_pessoa: 'PF',
  documento: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  desconto_percentual: '0',
}

function formatarDocumento(tipoPessoa: 'PF' | 'PJ', documento: string | null) {
  if (!documento) return 'Sem documento'
  if (tipoPessoa === 'PF' && /^\d{11}$/.test(documento)) {
    return `${documento.slice(0, 3)}.${documento.slice(3, 6)}.${documento.slice(6, 9)}-${documento.slice(9)}`
  }
  if (tipoPessoa === 'PJ' && /^[A-Z0-9]{12}\d{2}$/.test(documento)) {
    return `${documento.slice(0, 2)}.${documento.slice(2, 5)}.${documento.slice(5, 8)}/${documento.slice(8, 12)}-${documento.slice(12)}`
  }
  return documento
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
      ? [cliente.nome, cliente.documento, cliente.telefone, cliente.email]
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
      tipo_pessoa: cliente.tipo_pessoa || 'PF',
      documento: cliente.documento || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      cep: cliente.cep || '',
      logradouro: cliente.logradouro || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || '',
      desconto_percentual: String(cliente.desconto_percentual ?? 0),
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
    const documento = formulario.documento.trim()

    if (!nome) {
      toast.warning(formulario.tipo_pessoa === 'PF' ? 'Informe o nome do cliente.' : 'Informe a razão social do cliente.')
      return
    }

    const descontoPercentual = Number(formulario.desconto_percentual)
    if (!Number.isFinite(descontoPercentual) || descontoPercentual < 0 || descontoPercentual > 100) {
      toast.warning('O desconto deve estar entre 0% e 100%.')
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
            tipo_pessoa: formulario.tipo_pessoa,
            documento: documento || null,
            telefone: formulario.telefone.trim() || null,
            email: formulario.email.trim() || null,
            cep: formulario.cep.trim() || null,
            logradouro: formulario.logradouro.trim() || null,
            numero: formulario.numero.trim() || null,
            complemento: formulario.complemento.trim() || null,
            bairro: formulario.bairro.trim() || null,
            cidade: formulario.cidade.trim() || null,
            uf: formulario.uf.trim() || null,
            desconto_percentual: descontoPercentual,
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
                <option value="documento">Documento (CPF/CNPJ)</option>
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
                    <span>{cliente.documento ? `${cliente.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'} ${formatarDocumento(cliente.tipo_pessoa, cliente.documento)}` : 'Sem documento'}{cliente.telefone ? ` • ${cliente.telefone}` : ''}</span>
                  </div>
                </div>
                <div className="customer-contact">
                  <span>{cliente.email || 'Sem e-mail cadastrado'}</span>
                  {(cliente.cidade || cliente.uf) && <span>{[cliente.cidade, cliente.uf].filter(Boolean).join(' - ')}</span>}
                </div>
                <span className="customer-sales">{Number(cliente.desconto_percentual)}% desconto</span>
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
          <form className="customers-modal customers-customer-form-modal" onSubmit={salvarCliente} onClick={(event) => event.stopPropagation()}>
            <div className="customers-modal-header">
              <div>
                <span className="customers-eyebrow">Relacionamento</span>
                <h2>{clienteEditando ? 'Editar cliente' : 'Cadastrar cliente'}</h2>
              </div>
              <button type="button" className="customers-close-button" onClick={() => fecharModal()} disabled={salvando} title="Fechar"><FiX /></button>
            </div>
            <div className="customer-form-grid">
              <label className="customer-form-wide">{formulario.tipo_pessoa === 'PF' ? 'Nome completo' : 'Razão social'}<input autoFocus value={formulario.nome} onChange={(event) => atualizarCampo('nome', event.target.value)} maxLength={150} required /></label>
              <label>Tipo de pessoa<select value={formulario.tipo_pessoa} onChange={(event) => { atualizarCampo('tipo_pessoa', event.target.value as 'PF' | 'PJ'); atualizarCampo('documento', '') }}><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></label>
              <label>{formulario.tipo_pessoa === 'PF' ? 'CPF (opcional)' : 'CNPJ (opcional)'}<input value={formulario.documento} onChange={(event) => {
                const documento = formulario.tipo_pessoa === 'PF'
                  ? event.target.value.replace(/\D/g, '').slice(0, 11)
                  : event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14)
                atualizarCampo('documento', documento)
              }} maxLength={14} /><small className="customer-document-hint">Será validado se informado.</small></label>
              <label>Telefone<input value={formulario.telefone} onChange={(event) => atualizarCampo('telefone', event.target.value)} maxLength={30} /></label>
              <label>E-mail<input type="email" value={formulario.email} onChange={(event) => atualizarCampo('email', event.target.value)} maxLength={150} /></label>
              <label>CEP<input inputMode="numeric" value={formulario.cep} onChange={(event) => atualizarCampo('cep', event.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={8} /></label>
              <label className="customer-form-wide">Logradouro<input value={formulario.logradouro} onChange={(event) => atualizarCampo('logradouro', event.target.value)} maxLength={150} /></label>
              <label>Número<input value={formulario.numero} onChange={(event) => atualizarCampo('numero', event.target.value)} maxLength={20} /></label>
              <label>Complemento<input value={formulario.complemento} onChange={(event) => atualizarCampo('complemento', event.target.value)} maxLength={100} /></label>
              <label>Bairro<input value={formulario.bairro} onChange={(event) => atualizarCampo('bairro', event.target.value)} maxLength={100} /></label>
              <label>Cidade<input value={formulario.cidade} onChange={(event) => atualizarCampo('cidade', event.target.value)} maxLength={100} /></label>
              <label>UF<input value={formulario.uf} onChange={(event) => atualizarCampo('uf', event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2))} maxLength={2} /></label>
              <label className="customer-discount-field">
                Desconto padrão (%)
                <input type="number" min="0" max="100" step="0.01" value={formulario.desconto_percentual} onChange={(event) => atualizarCampo('desconto_percentual', event.target.value)} />
                <small>Será sugerido em cada venda e pode ser ajustado no PDV.</small>
              </label>
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
