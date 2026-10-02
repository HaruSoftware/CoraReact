import { useEffect, useMemo, useState } from 'react'
import {
  FiDownload,
  FiEye,
  FiMinus,
  FiPackage,
  FiPlus,
  FiSearch,
  FiShoppingCart,
  FiX,
} from 'react-icons/fi'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContextValue'
import { useToast } from '../contexts/ToastContextValue'
import './SalesPage.css'

type Cliente = {
  id_cliente: number
  nome: string
  tipo_pessoa: 'PF' | 'PJ'
  documento: string | null
  telefone: string | null
  email: string | null
  desconto_percentual: number | string
}

type Produto = {
  id_produto: number
  id_categoria: number
  nome: string
  descricao: string | null
  codigo_barras: string | null
  codigo_interno: string | null
  preco: number | string
  estoque: number
  unidade_medida: string
  ativo: boolean
}

type Categoria = { id_categoria: number; nome: string }

type Venda = {
  id_venda: number
  data: string
  valor_subtotal: number | string
  desconto_percentual: number | string
  valor_desconto: number | string
  valor_total: number | string
  nome_cliente: string
  nome_usuario: string
  quantidade_itens: number
}

type ItemVenda = {
  id_item_venda: number
  id_produto: number
  nome_produto: string
  quantidade: number
  preco_venda: number | string
  subtotal: number | string
}

type VendaDetalhe = Venda & { itens: ItemVenda[] }
type ItemCarrinho = { produto: Produto; quantidade: number }

function formatarPreco(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarCentavos(valor: number) {
  return formatarPreco(valor / 100)
}

function formatarData(valor: string) {
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatarDataRelativa(valor: string, agora: number) {
  const dataMs = new Date(valor).getTime()
  if (!Number.isFinite(dataMs)) return valor

  const minutos = Math.floor((agora - dataMs) / 60_000)
  if (minutos < 0 || minutos >= 360) return formatarData(valor)
  if (minutos === 0) return 'agora'
  if (minutos < 60) return `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`

  const horas = Math.floor(minutos / 60)
  return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`
}

function normalizarBusca(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

async function baixarComprovante(venda: VendaDetalhe) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const documento = new jsPDF({ unit: 'mm', format: 'a4' })
  const larguraPagina = documento.internal.pageSize.getWidth()
  const alturaPagina = documento.internal.pageSize.getHeight()

  documento.setTextColor(17, 24, 39)
  documento.setFont('helvetica', 'bold')
  documento.setFontSize(18)
  documento.text('Cora', 14, 18)
  documento.setFontSize(12)
  documento.text(`Comprovante de venda #${venda.id_venda}`, 14, 26)
  documento.setFont('helvetica', 'normal')
  documento.setFontSize(9)
  documento.setTextColor(75, 85, 99)

  let posicaoY = 34
  const informacoes = [
    `Data: ${formatarData(venda.data)}`,
    `Cliente: ${venda.nome_cliente}`,
    `Responsável: ${venda.nome_usuario || 'Não informado'}`,
    'Comprovante interno - não é documento fiscal',
  ]
  informacoes.forEach((informacao) => {
    const linhas = documento.splitTextToSize(informacao, larguraPagina - 28)
    documento.text(linhas, 14, posicaoY)
    posicaoY += linhas.length * 4.5 + 2
  })

  autoTable(documento, {
    startY: posicaoY + 2,
    head: [['Produto', 'Qtd.', 'Preço unitário', 'Total']],
    body: venda.itens.map((item) => [
      item.nome_produto,
      String(item.quantidade),
      formatarPreco(item.preco_venda),
      formatarPreco(item.subtotal),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: [31, 41, 55] },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    columnStyles: {
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
  })

  const finalTabelaY = (documento as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const resumoY = finalTabelaY + 10
  const resumoEmNovaPagina = resumoY + 34 > alturaPagina - 14
  if (resumoEmNovaPagina) documento.addPage()
  const linhaResumo = resumoEmNovaPagina ? 24 : resumoY

  const xRotulo = larguraPagina - 74
  const xValor = larguraPagina - 14
  documento.setFont('helvetica', 'normal')
  documento.setFontSize(10)
  documento.setTextColor(55, 65, 81)
  documento.text('Subtotal', xRotulo, linhaResumo)
  documento.text(formatarPreco(venda.valor_subtotal), xValor, linhaResumo, { align: 'right' })
  documento.text(`Desconto (${Number(venda.desconto_percentual)}%)`, xRotulo, linhaResumo + 7)
  documento.text(`- ${formatarPreco(venda.valor_desconto)}`, xValor, linhaResumo + 7, { align: 'right' })
  documento.setDrawColor(156, 163, 175)
  documento.line(xRotulo, linhaResumo + 11, xValor, linhaResumo + 11)
  documento.setFont('helvetica', 'bold')
  documento.setFontSize(12)
  documento.setTextColor(17, 24, 39)
  documento.text('Total da venda', xRotulo, linhaResumo + 18)
  documento.text(formatarPreco(venda.valor_total), xValor, linhaResumo + 18, { align: 'right' })

  documento.save(`comprovante-venda-${venda.id_venda}.pdf`)
}

function SalesPage() {
  const { usuario } = useAuth()
  const { toast } = useToast()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [categoriaProdutoFiltro, setCategoriaProdutoFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalVendaAberto, setModalVendaAberto] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [descontoPercentual, setDescontoPercentual] = useState('0')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [salvando, setSalvando] = useState(false)
  const [vendaDetalhe, setVendaDetalhe] = useState<VendaDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(Date.now()), 60_000)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.all([api('/vendas'), api('/clientes'), api('/produtos'), api('/categorias')])
      .then(([vendasData, clientesData, produtosData, categoriasData]) => {
        if (!ativo) return
        setVendas(Array.isArray(vendasData) ? vendasData : [])
        setClientes(Array.isArray(clientesData) ? clientesData : [])
        setProdutos(Array.isArray(produtosData) ? produtosData : [])
        setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      })
      .catch((error: unknown) => {
        if (ativo) toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as vendas.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [toast])

  const vendasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca)
    if (!termo) return vendas
    return vendas.filter((venda) =>
      String(venda.id_venda).includes(termo)
      || normalizarBusca(venda.nome_cliente).includes(termo)
      || normalizarBusca(venda.nome_usuario).includes(termo)
    )
  }, [busca, vendas])

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarBusca(buscaCliente)
    if (!termo) return []
    const documentoBusca = termo.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const digitos = termo.replace(/\D/g, '')
    return clientes.filter((cliente) => {
      const texto = [cliente.nome, cliente.email].some((campo) => normalizarBusca(campo || '').includes(termo))
      const numero = (digitos.length > 0 && (cliente.telefone || '').replace(/\D/g, '').includes(digitos))
        || (documentoBusca.length > 0 && (cliente.documento || '').toUpperCase().includes(documentoBusca))
      return texto || numero
    }).slice(0, 8)
  }, [buscaCliente, clientes])

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarBusca(buscaProduto)
    return produtos.filter((produto) => {
      if (!produto.ativo || produto.estoque <= 0) return false
      if (categoriaProdutoFiltro && String(produto.id_categoria) !== categoriaProdutoFiltro) return false
      if (!termo) return true
      const nomeCategoria = categorias.find((categoria) => categoria.id_categoria === produto.id_categoria)?.nome || ''
      return [produto.nome, produto.descricao, produto.codigo_interno, produto.codigo_barras, nomeCategoria]
        .some((campo) => normalizarBusca(campo || '').includes(termo))
    })
  }, [buscaProduto, categoriaProdutoFiltro, categorias, produtos])

  const clienteSelecionadoData = clientes.find((cliente) => String(cliente.id_cliente) === clienteSelecionado)
  const motivoBloqueioNovaVenda = carregando
    ? 'Carregando clientes e produtos...'
    : clientes.length === 0
      ? 'Cadastre um cliente antes de iniciar uma venda.'
      : produtos.length === 0
        ? 'Cadastre um produto antes de iniciar uma venda.'
        : ''
  const novaVendaBloqueada = Boolean(motivoBloqueioNovaVenda)
  const subtotalCarrinhoCentavos = carrinho.reduce(
    (total, item) => total + Math.round(Number(item.produto.preco) * 100) * item.quantidade,
    0
  )
  const percentualNumerico = Number(descontoPercentual)
  const descontoCarrinhoCentavos = Number.isFinite(percentualNumerico) && percentualNumerico >= 0 && percentualNumerico <= 100
    ? Math.round(subtotalCarrinhoCentavos * Math.round(percentualNumerico * 100) / 10000)
    : 0
  const totalCarrinhoCentavos = subtotalCarrinhoCentavos - descontoCarrinhoCentavos

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const vendasDoMes = vendas.filter((venda) => new Date(venda.data) >= inicioMes)
  const faturamentoDoMes = vendasDoMes.reduce((total, venda) => total + Number(venda.valor_total), 0)
  const ticketMedio = vendasDoMes.length > 0 ? faturamentoDoMes / vendasDoMes.length : 0

  function abrirNovaVenda() {
    setClienteSelecionado('')
    setBuscaCliente('')
    setBuscaProduto('')
    setCategoriaProdutoFiltro('')
    setDescontoPercentual('0')
    setCarrinho([])
    setModalVendaAberto(true)
  }

  function fecharNovaVenda() {
    if (!salvando) setModalVendaAberto(false)
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(String(cliente.id_cliente))
    setBuscaCliente('')
    setDescontoPercentual(String(cliente.desconto_percentual ?? 0))
  }

  function adicionarProduto(produto: Produto) {
    const item = carrinho.find((atual) => atual.produto.id_produto === produto.id_produto)
    if (item && item.quantidade >= produto.estoque) {
      toast.warning('A quantidade no carrinho já atingiu o estoque disponível.')
      return
    }
    setCarrinho((atuais) => item
      ? atuais.map((atual) => atual.produto.id_produto === produto.id_produto
        ? { ...atual, quantidade: atual.quantidade + 1 }
        : atual)
      : [...atuais, { produto, quantidade: 1 }]
    )
  }

  function alterarQuantidade(idProduto: number, variacao: number) {
    setCarrinho((atuais) => atuais.flatMap((item) => {
      if (item.produto.id_produto !== idProduto) return [item]
      const quantidade = item.quantidade + variacao
      return quantidade > 0 ? [{ ...item, quantidade }] : []
    }))
  }

  async function registrarVenda(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clienteSelecionado || carrinho.length === 0) return
    if (!Number.isFinite(percentualNumerico) || percentualNumerico < 0 || percentualNumerico > 100) {
      toast.warning('Informe um desconto entre 0% e 100%.')
      return
    }

    try {
      setSalvando(true)
      const resposta = await api('/vendas', {
        method: 'POST',
        body: JSON.stringify({
          id_cliente: Number(clienteSelecionado),
          desconto_percentual: percentualNumerico,
          itens: carrinho.map((item) => ({
            id_produto: item.produto.id_produto,
            quantidade: item.quantidade,
          })),
        }),
      })

      setModalVendaAberto(false)
      toast.success('Venda registrada e estoque atualizado.')
      const [vendasData, produtosData] = await Promise.all([api('/vendas'), api('/produtos')])
      setVendas(Array.isArray(vendasData) ? vendasData : [])
      setProdutos(Array.isArray(produtosData) ? produtosData : [])
      const idVenda = Number(resposta?.venda?.id_venda)
      if (Number.isInteger(idVenda) && idVenda > 0) {
        try {
          setVendaDetalhe(await api(`/vendas/${idVenda}`))
        } catch {
          toast.warning('Venda registrada. Não foi possível abrir o comprovante; você pode acessá-lo pelo histórico.')
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a venda.')
    } finally {
      setSalvando(false)
    }
  }

  async function abrirDetalhes(idVenda: number) {
    setVendaDetalhe(null)
    setCarregandoDetalhe(true)
    try {
      setVendaDetalhe(await api(`/vendas/${idVenda}`))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os detalhes.')
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  return (
    <div className="sales-page">
      <header className="sales-header">
        <div>
          <span className="sales-eyebrow">Operação comercial</span>
          <h1>Vendas</h1>
          <p>Registre vendas, acompanhe o histórico e confira os itens de cada pedido.</p>
        </div>
        <span
          className={`sales-new-sale-action${novaVendaBloqueada ? ' is-disabled' : ''}`}
          tabIndex={novaVendaBloqueada ? 0 : undefined}
          aria-describedby={novaVendaBloqueada ? 'sales-new-sale-tooltip' : undefined}
        >
          <button className="sales-primary-button" onClick={abrirNovaVenda} disabled={novaVendaBloqueada}>
            <FiPlus /> Nova venda
          </button>
          {novaVendaBloqueada && (
            <span className="sales-action-tooltip" id="sales-new-sale-tooltip" role="tooltip">
              {motivoBloqueioNovaVenda}
            </span>
          )}
        </span>
      </header>

      <section className="sales-metrics" aria-label="Resumo do mês">
        <article className="sales-metric"><span>Vendas no mês</span><strong>{vendasDoMes.length}</strong><small>registros desde o início do mês</small></article>
        <article className="sales-metric sales-metric-revenue"><span>Faturamento no mês</span><strong>{formatarPreco(faturamentoDoMes)}</strong><small>valor total das vendas registradas</small></article>
        <article className="sales-metric"><span>Ticket médio</span><strong>{formatarPreco(ticketMedio)}</strong><small>média por venda neste mês</small></article>
      </section>

      <section className="sales-history">
        <div className="sales-history-heading">
          <div><h2>Histórico de vendas</h2><p>{vendas.length} {vendas.length === 1 ? 'venda registrada' : 'vendas registradas'}</p></div>
          <label className="sales-search"><FiSearch aria-hidden="true" /><input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar venda ou cliente" aria-label="Buscar venda ou cliente" /></label>
        </div>

        {carregando ? (
          <div className="sales-state"><span className="sales-spinner" />Carregando vendas...</div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="sales-state sales-empty-state">
            <div className="sales-empty-icon"><FiShoppingCart /></div>
            <strong>{busca ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}</strong>
            <p>{busca ? 'Tente buscar por outro código ou cliente.' : 'As vendas concluídas aparecerão aqui.'}</p>
            {!busca && clientes.length > 0 && produtos.some((produto) => produto.ativo && produto.estoque > 0) && <button className="sales-secondary-button" onClick={abrirNovaVenda}><FiPlus /> Registrar primeira venda</button>}
          </div>
        ) : (
          <div className="sales-table-scroll">
            <table className="sales-table">
              <thead><tr><th>Venda</th><th>Data e hora</th><th>Cliente</th><th>Unidades</th><th>Responsável</th><th>Desconto</th><th className="sales-number-cell">Total</th><th><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.id_venda}>
                    <td><strong className="sales-code">#{venda.id_venda}</strong></td>
                    <td><time dateTime={venda.data} title={formatarData(venda.data)} aria-label={formatarData(venda.data)}>{formatarDataRelativa(venda.data, agora)}</time></td>
                    <td className="sales-customer-cell">{venda.nome_cliente}</td>
                    <td>{venda.quantidade_itens}</td>
                    <td>{venda.nome_usuario || usuario?.nome}</td>
                    <td>{Number(venda.desconto_percentual)}% · {formatarPreco(venda.valor_desconto)}</td>
                    <td className="sales-number-cell sales-total-cell">{formatarPreco(venda.valor_total)}</td>
                    <td className="sales-action-cell"><button className="sales-icon-button" onClick={() => abrirDetalhes(venda.id_venda)} title={`Ver venda ${venda.id_venda}`} aria-label={`Ver venda ${venda.id_venda}`}><FiEye /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalVendaAberto && (
        <div className="sales-overlay" onClick={fecharNovaVenda}>
          <form className="sales-modal" onSubmit={registrarVenda} onClick={(event) => event.stopPropagation()}>
            <header className="sales-modal-header">
              <div><span className="sales-eyebrow">Ponto de venda</span><h2>Nova venda</h2></div>
              <button type="button" className="sales-close-button" onClick={fecharNovaVenda} disabled={salvando} title="Fechar"><FiX /></button>
            </header>

            {clientes.length === 0 ? (
              <div className="sales-prerequisite">Cadastre um cliente antes de registrar uma venda.</div>
            ) : produtos.every((produto) => !produto.ativo || produto.estoque <= 0) ? (
              <div className="sales-prerequisite">Cadastre produtos ativos com estoque disponível antes de registrar uma venda.</div>
            ) : (
              <>
                <section className="sales-client-picker">
                  <label htmlFor="sales-client-search">Cliente</label>
                  {clienteSelecionadoData ? (
                    <div className="sales-selected-client">
                      <div><strong>{clienteSelecionadoData.nome}</strong><span>{clienteSelecionadoData.documento ? `${clienteSelecionadoData.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'} ${clienteSelecionadoData.documento}` : 'Sem documento'} · desconto padrão {Number(clienteSelecionadoData.desconto_percentual)}%</span></div>
                      <button type="button" onClick={() => { setClienteSelecionado(''); setDescontoPercentual('0') }} title="Trocar cliente"><FiX /></button>
                    </div>
                  ) : (
                    <>
                      <label className="sales-search sales-client-search"><FiSearch aria-hidden="true" /><input id="sales-client-search" value={buscaCliente} onChange={(event) => setBuscaCliente(event.target.value)} placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail" autoComplete="off" /></label>
                      {buscaCliente.trim() && (
                        <div className="sales-client-results">
                          {clientesFiltrados.length === 0 ? <p>Nenhum cliente encontrado.</p> : clientesFiltrados.map((cliente) => (
                            <button type="button" key={cliente.id_cliente} onClick={() => selecionarCliente(cliente)}>
                              <span><strong>{cliente.nome}</strong><small>{cliente.documento ? `${cliente.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'} ${cliente.documento}` : 'Sem documento'}{cliente.telefone ? ` · ${cliente.telefone}` : ''}</small></span>
                              <span className="sales-client-discount">{Number(cliente.desconto_percentual)}%</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </section>

                {clienteSelecionadoData && (
                  <label className="sales-discount-input">Desconto aplicado (%)
                    <input type="number" min="0" max="100" step="0.01" value={descontoPercentual} onChange={(event) => setDescontoPercentual(event.target.value)} />
                    <span>Padrão do cliente: {Number(clienteSelecionadoData.desconto_percentual)}%. Você pode ajustar este valor só para esta venda.</span>
                  </label>
                )}

                <div className="sales-builder">
                  <section className="sales-product-picker">
                    <div className="sales-picker-heading">
                      <h3>Produtos</h3>
                      <label className="sales-search sales-product-search"><FiSearch aria-hidden="true" /><input value={buscaProduto} onChange={(event) => setBuscaProduto(event.target.value)} placeholder="Nome, código ou categoria" aria-label="Buscar produto" /></label>
                    </div>
                    <div className="sales-product-filters">
                      <select value={categoriaProdutoFiltro} onChange={(event) => setCategoriaProdutoFiltro(event.target.value)} aria-label="Filtrar por categoria">
                        <option value="">Todas as categorias</option>
                        {categorias.map((categoria) => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nome}</option>)}
                      </select>
                    </div>
                    <div className="sales-product-list">
                      {produtosFiltrados.length === 0 ? <div className="sales-product-empty">Nenhum produto com estoque disponível.</div> : produtosFiltrados.map((produto) => {
                        const categoria = categorias.find((item) => item.id_categoria === produto.id_categoria)?.nome || 'Sem categoria'
                        return (
                          <article className="sales-product-option" key={produto.id_produto}>
                            <div className="sales-product-symbol"><FiPackage /></div>
                            <div className="sales-product-info"><strong>{produto.nome}</strong><span>{categoria} · {produto.codigo_interno || 'Sem código interno'}{produto.codigo_barras ? ` · EAN ${produto.codigo_barras}` : ''}</span><small>{produto.estoque} {produto.unidade_medida} disponíveis</small></div>
                            <div className="sales-product-price"><strong>{formatarPreco(produto.preco)}</strong><button type="button" className="sales-add-button" onClick={() => adicionarProduto(produto)} title={`Adicionar ${produto.nome}`} aria-label={`Adicionar ${produto.nome}`}><FiPlus /></button></div>
                          </article>
                        )
                      })}
                    </div>
                  </section>

                  <section className="sales-cart">
                    <div className="sales-cart-heading"><h3>Carrinho</h3><span>{carrinho.reduce((total, item) => total + item.quantidade, 0)} un.</span></div>
                    {carrinho.length === 0 ? <div className="sales-cart-empty"><FiShoppingCart /><span>Adicione produtos para começar.</span></div> : (
                      <div className="sales-cart-list">
                        {carrinho.map((item) => (
                          <article className="sales-cart-item" key={item.produto.id_produto}>
                            <div className="sales-cart-item-main"><strong>{item.produto.nome}</strong><span>{formatarPreco(item.produto.preco)} cada</span></div>
                            <div className="sales-quantity-control"><button type="button" onClick={() => alterarQuantidade(item.produto.id_produto, -1)} title="Diminuir quantidade" aria-label={`Diminuir ${item.produto.nome}`}><FiMinus /></button><span>{item.quantidade}</span><button type="button" onClick={() => alterarQuantidade(item.produto.id_produto, 1)} disabled={item.quantidade >= item.produto.estoque} title="Aumentar quantidade" aria-label={`Aumentar ${item.produto.nome}`}><FiPlus /></button></div>
                            <strong className="sales-cart-subtotal">{formatarPreco(Math.round(Number(item.produto.preco) * 100) * item.quantidade / 100)}</strong>
                          </article>
                        ))}
                      </div>
                    )}
                    <div className="sales-cart-summary">
                      <div><span>Subtotal</span><strong>{formatarCentavos(subtotalCarrinhoCentavos)}</strong></div>
                      <div className="sales-cart-discount"><span>Desconto ({Number.isFinite(percentualNumerico) ? percentualNumerico : 0}%)</span><strong>− {formatarCentavos(descontoCarrinhoCentavos)}</strong></div>
                      <div className="sales-cart-total"><span>Total</span><strong>{formatarCentavos(totalCarrinhoCentavos)}</strong></div>
                    </div>
                  </section>
                </div>

                <footer className="sales-modal-actions"><span>O estoque e o desconto serão registrados ao concluir a venda.</span><div><button type="button" className="sales-secondary-button" onClick={fecharNovaVenda} disabled={salvando}>Cancelar</button><button type="submit" className="sales-primary-button" disabled={salvando || !clienteSelecionado || carrinho.length === 0}>{salvando ? 'Registrando...' : 'Concluir venda'}</button></div></footer>
              </>
            )}
          </form>
        </div>
      )}

      {(vendaDetalhe || carregandoDetalhe) && (
        <div className="sales-overlay" onClick={() => !carregandoDetalhe && setVendaDetalhe(null)}>
          <section className="sales-detail-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="sale-detail-title" aria-modal="true" role="dialog">
            <header className="sales-modal-header sales-detail-modal-header"><div><span className="sales-eyebrow">Comprovante interno</span><h2 id="sale-detail-title">{vendaDetalhe ? `Venda #${vendaDetalhe.id_venda}` : 'Detalhes da venda'}</h2></div><div className="sales-detail-actions">{vendaDetalhe && <button type="button" className="sales-secondary-button sales-pdf-button" onClick={() => void baixarComprovante(vendaDetalhe).catch(() => toast.error('Não foi possível gerar o PDF.'))}><FiDownload /> Baixar PDF</button>}<button type="button" className="sales-close-button" onClick={() => setVendaDetalhe(null)} disabled={carregandoDetalhe} title="Fechar"><FiX /></button></div></header>
            {carregandoDetalhe ? <div className="sales-state"><span className="sales-spinner" />Carregando itens...</div> : vendaDetalhe && (
              <>
                <dl className="sales-detail-meta"><div><dt>Venda</dt><dd>#{vendaDetalhe.id_venda}</dd></div><div><dt>Data</dt><dd>{formatarData(vendaDetalhe.data)}</dd></div><div><dt>Cliente</dt><dd>{vendaDetalhe.nome_cliente}</dd></div><div><dt>Responsável</dt><dd>{vendaDetalhe.nome_usuario}</dd></div></dl>
                <div className="sales-detail-items">
                  <div className="sales-detail-item sales-detail-item-header"><span>Produto</span><span>Qtd.</span><span>Unitário</span><span>Total</span></div>
                  {vendaDetalhe.itens.map((item) => <div className="sales-detail-item" key={item.id_item_venda}><strong>{item.nome_produto}</strong><span>{item.quantidade}</span><span>{formatarPreco(item.preco_venda)}</span><strong>{formatarPreco(item.subtotal)}</strong></div>)}
                </div>
                <div className="sales-detail-financial"><div><span>Subtotal</span><strong>{formatarPreco(vendaDetalhe.valor_subtotal)}</strong></div><div><span>Desconto ({Number(vendaDetalhe.desconto_percentual)}%)</span><strong>− {formatarPreco(vendaDetalhe.valor_desconto)}</strong></div></div>
                <div className="sales-detail-total"><span>Total da venda</span><strong>{formatarPreco(vendaDetalhe.valor_total)}</strong></div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default SalesPage
