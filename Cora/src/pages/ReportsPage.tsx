import { useEffect, useState } from 'react'
import {
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiDownload,
  FiFileText,
  FiLayers,
  FiPackage,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContextValue'
import './ReportsPage.css'

type FormatoColuna = 'texto' | 'numero' | 'moeda' | 'data'
type ColunaRelatorio = { chave: string; rotulo: string; formato?: FormatoColuna }
type TipoRelatorio = 'vendas' | 'financeiro' | 'produtos' | 'categorias' | 'vendedores' | 'clientes' | 'estoque'
type LinhaRelatorio = Record<string, unknown>

type DefinicaoRelatorio = {
  tipo: TipoRelatorio
  titulo: string
  descricao: string
  icone: typeof FiFileText
  colunas: ColunaRelatorio[]
  usaPeriodo?: boolean
  grafico: {
    titulo: string
    rotulo: string
    chave: string
    formato: 'numero' | 'moeda'
    tipo: 'diario' | 'ranking'
  }
}

const RELATORIOS: DefinicaoRelatorio[] = [
  {
    tipo: 'vendas',
    titulo: 'Vendas realizadas',
    descricao: 'Consulte cada venda, cliente, responsável, quantidade de itens, descontos e valor final.',
    icone: FiShoppingBag,
    grafico: { titulo: 'Faturamento diário', rotulo: 'Faturamento', chave: 'total', formato: 'moeda', tipo: 'diario' },
    colunas: [
      { chave: 'id_venda', rotulo: 'Nº venda', formato: 'numero' },
      { chave: 'data', rotulo: 'Data', formato: 'data' },
      { chave: 'cliente', rotulo: 'Cliente' },
      { chave: 'vendedor', rotulo: 'Vendedor' },
      { chave: 'quantidade_itens', rotulo: 'Itens', formato: 'numero' },
      { chave: 'subtotal', rotulo: 'Subtotal', formato: 'moeda' },
      { chave: 'desconto', rotulo: 'Desconto', formato: 'moeda' },
      { chave: 'total', rotulo: 'Total', formato: 'moeda' },
    ],
  },
  {
    tipo: 'financeiro',
    titulo: 'Resumo financeiro',
    descricao: 'Veja por dia o volume vendido, subtotal, descontos concedidos, faturamento e ticket médio.',
    icone: FiBarChart2,
    grafico: { titulo: 'Faturamento diário', rotulo: 'Faturamento', chave: 'faturamento', formato: 'moeda', tipo: 'diario' },
    colunas: [
      { chave: 'dia', rotulo: 'Dia', formato: 'data' },
      { chave: 'vendas', rotulo: 'Vendas', formato: 'numero' },
      { chave: 'subtotal', rotulo: 'Subtotal', formato: 'moeda' },
      { chave: 'descontos', rotulo: 'Descontos', formato: 'moeda' },
      { chave: 'faturamento', rotulo: 'Faturamento', formato: 'moeda' },
      { chave: 'ticket_medio', rotulo: 'Ticket médio', formato: 'moeda' },
    ],
  },
  {
    tipo: 'produtos',
    titulo: 'Produtos vendidos',
    descricao: 'Identifique os itens mais vendidos, a categoria de cada um e o faturamento gerado.',
    icone: FiPackage,
    grafico: { titulo: 'Produtos por faturamento', rotulo: 'Produto', chave: 'faturamento', formato: 'moeda', tipo: 'ranking' },
    colunas: [
      { chave: 'codigo', rotulo: 'Código' },
      { chave: 'produto', rotulo: 'Produto' },
      { chave: 'categoria', rotulo: 'Categoria' },
      { chave: 'unidades_vendidas', rotulo: 'Unidades vendidas', formato: 'numero' },
      { chave: 'faturamento', rotulo: 'Faturamento', formato: 'moeda' },
    ],
  },
  {
    tipo: 'categorias',
    titulo: 'Vendas por categoria',
    descricao: 'Compare categorias pelo número de vendas, produtos, unidades comercializadas e faturamento.',
    icone: FiLayers,
    grafico: { titulo: 'Faturamento por categoria', rotulo: 'Categoria', chave: 'faturamento', formato: 'moeda', tipo: 'ranking' },
    colunas: [
      { chave: 'categoria', rotulo: 'Categoria' },
      { chave: 'vendas', rotulo: 'Vendas', formato: 'numero' },
      { chave: 'produtos', rotulo: 'Produtos', formato: 'numero' },
      { chave: 'unidades_vendidas', rotulo: 'Unidades vendidas', formato: 'numero' },
      { chave: 'faturamento', rotulo: 'Faturamento', formato: 'moeda' },
    ],
  },
  {
    tipo: 'vendedores',
    titulo: 'Desempenho de vendedores',
    descricao: 'Compare vendas realizadas, faturamento e ticket médio por integrante da equipe.',
    icone: FiUsers,
    grafico: { titulo: 'Faturamento por vendedor', rotulo: 'Vendedor', chave: 'faturamento', formato: 'moeda', tipo: 'ranking' },
    colunas: [
      { chave: 'vendedor', rotulo: 'Vendedor' },
      { chave: 'vendas', rotulo: 'Vendas', formato: 'numero' },
      { chave: 'faturamento', rotulo: 'Faturamento', formato: 'moeda' },
      { chave: 'ticket_medio', rotulo: 'Ticket médio', formato: 'moeda' },
    ],
  },
  {
    tipo: 'clientes',
    titulo: 'Compras por cliente',
    descricao: 'Saiba quem mais compra, quantas compras realizou e quanto movimentou no período.',
    icone: FiUsers,
    grafico: { titulo: 'Clientes por faturamento', rotulo: 'Cliente', chave: 'faturamento', formato: 'moeda', tipo: 'ranking' },
    colunas: [
      { chave: 'cliente', rotulo: 'Cliente' },
      { chave: 'tipo', rotulo: 'Tipo' },
      { chave: 'compras', rotulo: 'Compras', formato: 'numero' },
      { chave: 'faturamento', rotulo: 'Faturamento', formato: 'moeda' },
      { chave: 'ticket_medio', rotulo: 'Ticket médio', formato: 'moeda' },
    ],
  },
  {
    tipo: 'estoque',
    titulo: 'Posição de estoque',
    descricao: 'Confira estoque atual, mínimo, preço, valor em estoque e produtos que precisam de reposição.',
    icone: FiBox,
    usaPeriodo: false,
    grafico: { titulo: 'Valor potencial de venda por produto', rotulo: 'Produto', chave: 'valor_potencial_venda', formato: 'moeda', tipo: 'ranking' },
    colunas: [
      { chave: 'codigo', rotulo: 'Código' },
      { chave: 'produto', rotulo: 'Produto' },
      { chave: 'categoria', rotulo: 'Categoria' },
      { chave: 'quantidade', rotulo: 'Estoque', formato: 'numero' },
      { chave: 'estoque_minimo', rotulo: 'Mínimo', formato: 'numero' },
      { chave: 'unidade', rotulo: 'Unidade' },
      { chave: 'preco_unitario', rotulo: 'Preço unitário', formato: 'moeda' },
      { chave: 'custo_em_estoque', rotulo: 'Custo do estoque', formato: 'moeda' },
      { chave: 'valor_potencial_venda', rotulo: 'Valor potencial de venda', formato: 'moeda' },
      { chave: 'status', rotulo: 'Status' },
      { chave: 'situacao', rotulo: 'Situação' },
    ],
  },
]

function dataLocalIso(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function valorFormatado(valor: unknown, formato: FormatoColuna = 'texto') {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (formato === 'moeda') {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  if (formato === 'numero') return Number(valor).toLocaleString('pt-BR')
  if (formato === 'data') {
    const data = new Date(String(valor))
    return Number.isFinite(data.getTime())
      ? data.toLocaleString('pt-BR', String(valor).includes('T')
        ? { dateStyle: 'short', timeStyle: 'short' }
        : { dateStyle: 'short', timeZone: 'UTC' })
      : String(valor)
  }
  return String(valor)
}

function numero(valor: unknown) {
  const resultado = Number(valor)
  return Number.isFinite(resultado) ? resultado : 0
}

function resumoRelatorio(tipo: TipoRelatorio, linhas: LinhaRelatorio[]) {
  const soma = (chave: string) => linhas.reduce((total, linha) => total + numero(linha[chave]), 0)
  const primeiro = (rotulo: string, valor: string) => ({ rotulo, valor })

  switch (tipo) {
    case 'vendas': {
      const faturamento = soma('total')
      const descontos = soma('desconto')
      return [
        primeiro('Vendas realizadas', valorFormatado(linhas.length, 'numero')),
        primeiro('Faturamento líquido', valorFormatado(faturamento, 'moeda')),
        primeiro('Ticket médio', valorFormatado(linhas.length ? faturamento / linhas.length : 0, 'moeda')),
        primeiro('Descontos concedidos', valorFormatado(descontos, 'moeda')),
      ]
    }
    case 'financeiro': {
      const diasComVenda = linhas.filter((linha) => numero(linha.vendas) > 0).length
      const totalVendas = soma('vendas')
      return [
        primeiro('Faturamento', valorFormatado(soma('faturamento'), 'moeda')),
        primeiro('Vendas realizadas', valorFormatado(totalVendas, 'numero')),
        primeiro('Ticket médio do período', valorFormatado(totalVendas ? soma('faturamento') / totalVendas : 0, 'moeda')),
        primeiro('Dias com vendas', valorFormatado(diasComVenda, 'numero')),
      ]
    }
    case 'produtos': {
      const destaque = [...linhas].sort((a, b) => numero(b.unidades_vendidas) - numero(a.unidades_vendidas))[0]
      return [
        primeiro('Produtos vendidos', valorFormatado(linhas.length, 'numero')),
        primeiro('Unidades comercializadas', valorFormatado(soma('unidades_vendidas'), 'numero')),
        primeiro('Faturamento', valorFormatado(soma('faturamento'), 'moeda')),
        primeiro('Mais vendido', destaque ? String(destaque.produto) : '—'),
      ]
    }
    case 'categorias': {
      const destaque = [...linhas].sort((a, b) => numero(b.faturamento) - numero(a.faturamento))[0]
      return [
        primeiro('Categorias com vendas', valorFormatado(linhas.length, 'numero')),
        primeiro('Unidades comercializadas', valorFormatado(soma('unidades_vendidas'), 'numero')),
        primeiro('Faturamento', valorFormatado(soma('faturamento'), 'moeda')),
        primeiro('Categoria líder', destaque ? String(destaque.categoria) : '—'),
      ]
    }
    case 'vendedores': {
      const destaque = [...linhas].sort((a, b) => numero(b.faturamento) - numero(a.faturamento))[0]
      return [
        primeiro('Vendedores ativos', valorFormatado(linhas.length, 'numero')),
        primeiro('Vendas realizadas', valorFormatado(soma('vendas'), 'numero')),
        primeiro('Faturamento', valorFormatado(soma('faturamento'), 'moeda')),
        primeiro('Destaque em faturamento', destaque ? String(destaque.vendedor) : '—'),
      ]
    }
    case 'clientes': {
      const destaque = [...linhas].sort((a, b) => numero(b.faturamento) - numero(a.faturamento))[0]
      return [
        primeiro('Clientes compradores', valorFormatado(linhas.length, 'numero')),
        primeiro('Compras realizadas', valorFormatado(soma('compras'), 'numero')),
        primeiro('Faturamento', valorFormatado(soma('faturamento'), 'moeda')),
        primeiro('Maior cliente', destaque ? String(destaque.cliente) : '—'),
      ]
    }
    case 'estoque': {
      const abaixoDoMinimo = linhas.filter((linha) => linha.situacao === 'Abaixo do mínimo').length
      return [
        primeiro('Produtos cadastrados', valorFormatado(linhas.length, 'numero')),
        primeiro('Unidades em estoque', valorFormatado(soma('quantidade'), 'numero')),
        primeiro('Custo total do estoque', valorFormatado(soma('custo_em_estoque'), 'moeda')),
        primeiro('Abaixo do mínimo', valorFormatado(abaixoDoMinimo, 'numero')),
      ]
    }
  }
}

function dadosGrafico(relatorio: DefinicaoRelatorio, linhas: LinhaRelatorio[]) {
  if (relatorio.grafico.tipo === 'diario') {
    const agregados = new Map<string, number>()
    for (const linha of linhas) {
      const data = String(relatorio.tipo === 'financeiro' ? linha.dia : linha.data).slice(0, 10)
      if (!data || data === 'undefined') continue
      agregados.set(data, (agregados.get(data) ?? 0) + numero(linha[relatorio.grafico.chave]))
    }
    return [...agregados.entries()]
      .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
      .map(([rotulo, valor]) => ({ rotulo: valorFormatado(rotulo, 'data'), titulo: rotulo, valor }))
  }

  return linhas
    .map((linha) => {
      const rotulo = String(linha[relatorio.grafico.rotulo === 'Produto' ? 'produto' : relatorio.grafico.rotulo.toLowerCase()] ?? '')
      return {
        rotulo: rotulo || 'Sem nome',
        titulo: rotulo || 'Sem nome',
        valor: numero(linha[relatorio.grafico.chave]),
      }
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)
}

function csvSeguro(valor: string) {
  const protegido = /^[\s]*[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
  return `"${protegido.replace(/"/g, '""')}"`
}

function baixarArquivo(conteudo: BlobPart, tipo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ReportsPage() {
  const { toast } = useToast()
  const hoje = dataLocalIso(new Date())
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<DefinicaoRelatorio | null>(null)
  const [inicio, setInicio] = useState(() => `${hoje.slice(0, 8)}01`)
  const [fim, setFim] = useState(hoje)
  const [linhas, setLinhas] = useState<Array<Record<string, unknown>>>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!relatorioSelecionado) return
    let ativo = true

    const consulta = relatorioSelecionado.usaPeriodo === false
      ? ''
      : `?${new URLSearchParams({ inicio, fim }).toString()}`

    api(`/relatorios/${relatorioSelecionado.tipo}${consulta}`)
      .then((resultado: { rows: Array<Record<string, unknown>> }) => {
        if (ativo) setLinhas(resultado.rows)
      })
      .catch((error: unknown) => {
        console.error('Erro ao gerar relatório:', error)
        if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [fim, inicio, relatorioSelecionado])

  async function exportarPdf() {
    if (!relatorioSelecionado || linhas.length === 0) return
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const periodo = relatorioSelecionado.usaPeriodo === false
        ? 'Posição atual'
        : `${valorFormatado(inicio, 'data')} a ${valorFormatado(fim, 'data')}`
      documento.setFont('helvetica', 'bold')
      documento.setFontSize(16)
      documento.text(relatorioSelecionado.titulo, 14, 16)
      documento.setFont('helvetica', 'normal')
      documento.setFontSize(9)
      documento.text(`Período: ${periodo} · Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 23)
      autoTable(documento, {
        startY: 29,
        head: [relatorioSelecionado.colunas.map((coluna) => coluna.rotulo)],
        body: linhas.map((linha) => relatorioSelecionado.colunas.map((coluna) =>
          valorFormatado(linha[coluna.chave], coluna.formato)
        )),
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
        headStyles: { fillColor: [8, 127, 104], textColor: [255, 255, 255], fontStyle: 'bold' },
        didDrawPage: () => {
          const pagina = documento.getNumberOfPages()
          documento.setFontSize(8)
          documento.setTextColor(120)
          documento.text(`Página ${pagina}`, documento.internal.pageSize.getWidth() - 14, documento.internal.pageSize.getHeight() - 7, { align: 'right' })
        },
      })
      baixarArquivo(documento.output('blob'), 'application/pdf', `relatorio-${relatorioSelecionado.tipo}-${hoje}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar relatório PDF:', error)
      toast.error('Não foi possível exportar o PDF.')
    }
  }

  function exportarCsv() {
    if (!relatorioSelecionado || linhas.length === 0) return
    const cabecalho = relatorioSelecionado.colunas.map((coluna) => csvSeguro(coluna.rotulo))
    const registros = linhas.map((linha) =>
      relatorioSelecionado.colunas.map((coluna) =>
        csvSeguro(valorFormatado(linha[coluna.chave], coluna.formato))
      )
    )
    const conteudo = [cabecalho, ...registros].map((linha) => linha.join(';')).join('\r\n')
    baixarArquivo(`\uFEFF${conteudo}`, 'text/csv;charset=utf-8', `relatorio-${relatorioSelecionado.tipo}-${hoje}.csv`)
  }

  function voltarAoCatalogo() {
    setRelatorioSelecionado(null)
    setLinhas([])
    setErro('')
  }

  function abrirRelatorio(relatorio: DefinicaoRelatorio) {
    setCarregando(true)
    setErro('')
    setLinhas([])
    setRelatorioSelecionado(relatorio)
  }

  function atualizarInicio(valor: string) {
    setCarregando(true)
    setErro('')
    setLinhas([])
    setInicio(valor)
  }

  function atualizarFim(valor: string) {
    setCarregando(true)
    setErro('')
    setLinhas([])
    setFim(valor)
  }

  const resumo = relatorioSelecionado ? resumoRelatorio(relatorioSelecionado.tipo, linhas) : []
  const grafico = relatorioSelecionado ? dadosGrafico(relatorioSelecionado, linhas) : []
  const maximoGrafico = Math.max(...grafico.map((item) => item.valor), 0)
  const larguraGraficoDiario = Math.max(100, grafico.length * 28)

  if (!relatorioSelecionado) {
    return (
      <div className="reports-page">
        <header className="reports-header">
          <div>
            <span className="reports-eyebrow">Análises do negócio</span>
            <h1>Relatórios</h1>
            <p>Escolha um relatório para entender melhor os resultados da sua operação.</p>
          </div>
        </header>
        <section className="reports-grid" aria-label="Catálogo de relatórios">
          {RELATORIOS.map((relatorio) => {
            const Icone = relatorio.icone
            return (
              <article className="report-card" key={relatorio.tipo}>
                <span className="report-card-icon"><Icone aria-hidden="true" /></span>
                <span className="report-card-type">{relatorio.usaPeriodo === false ? 'Estoque' : 'Vendas e desempenho'}</span>
                <h2>{relatorio.titulo}</h2>
                <p>{relatorio.descricao}</p>
                <button type="button" className="report-open-button" onClick={() => abrirRelatorio(relatorio)}>
                  Abrir relatório
                </button>
              </article>
            )
          })}
        </section>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <header className="reports-header reports-detail-header">
        <button type="button" className="reports-back-button" aria-label="Voltar aos relatórios" onClick={voltarAoCatalogo}>
          <FiArrowLeft aria-hidden="true" />
        </button>
        <div>
          <span className="reports-eyebrow">Relatório</span>
          <h1>{relatorioSelecionado.titulo}</h1>
          <p>{relatorioSelecionado.descricao}</p>
        </div>
      </header>

      <section className="reports-controls" aria-label="Filtros e exportação">
        {relatorioSelecionado.usaPeriodo !== false ? (
          <div className="reports-date-fields">
            <label>
              <span>De</span>
              <input type="date" value={inicio} max={fim} onChange={(event) => atualizarInicio(event.target.value)} />
            </label>
            <label>
              <span>Até</span>
              <input type="date" value={fim} min={inicio} max={hoje} onChange={(event) => atualizarFim(event.target.value)} />
            </label>
          </div>
        ) : (
          <p className="reports-current-note">Exibindo a posição atual do estoque.</p>
        )}
        <div className="reports-export-actions">
          <button type="button" className="reports-secondary-button" onClick={exportarCsv} disabled={carregando || linhas.length === 0}>
            <FiDownload aria-hidden="true" /> Exportar CSV
          </button>
          <button type="button" className="reports-primary-button" onClick={() => void exportarPdf()} disabled={carregando || linhas.length === 0}>
            <FiFileText aria-hidden="true" /> Exportar PDF
          </button>
        </div>
      </section>

      {erro ? (
        <div className="reports-state reports-error" role="alert">
          <strong>Não foi possível gerar o relatório</strong>
          <p>{erro}</p>
        </div>
      ) : carregando ? (
        <div className="reports-state" role="status">
          <span className="reports-spinner" aria-hidden="true" />
          <strong>Gerando relatório...</strong>
        </div>
      ) : linhas.length === 0 ? (
        <div className="reports-state">
          <span className="reports-empty-icon"><FiFileText aria-hidden="true" /></span>
          <strong>Nenhum dado encontrado</strong>
          <p>Não há registros para exibir com o período selecionado.</p>
        </div>
      ) : !carregando && linhas.length > 0 ? (
        <>
          <section className="reports-summary" aria-label="Resumo do relatório">
            {resumo.map((item) => (
              <article className="reports-summary-card" key={item.rotulo}>
                <span>{item.rotulo}</span>
                <strong title={item.valor}>{item.valor}</strong>
              </article>
            ))}
          </section>

          {grafico.length > 0 && (
            <section className="reports-chart-panel" aria-label={relatorioSelecionado.grafico.titulo}>
              <header className="reports-chart-heading">
                <div>
                  <span>Análise visual</span>
                  <h2>{relatorioSelecionado.grafico.titulo}</h2>
                </div>
                <span className="reports-chart-unit">{relatorioSelecionado.grafico.formato === 'moeda' ? 'Valores em R$' : 'Quantidade'}</span>
              </header>
              {relatorioSelecionado.grafico.tipo === 'diario' ? (
                <div className="reports-daily-chart-scroll">
                  <div
                    className="reports-daily-chart"
                    role="img"
                    aria-label={`${relatorioSelecionado.grafico.titulo}: ${grafico.length} dias`}
                    style={{ width: grafico.length > 16 ? `${larguraGraficoDiario}px` : '100%' }}
                  >
                    {grafico.map((item) => {
                      const altura = maximoGrafico > 0 && item.valor > 0
                        ? Math.max((item.valor / maximoGrafico) * 100, 3)
                        : 0
                      const dia = new Date(`${item.titulo}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                      return (
                        <div className="reports-daily-column" key={item.titulo}>
                          <div className="reports-daily-track">
                            {altura > 0 && (
                              <span
                                className="reports-daily-bar"
                                style={{ height: `${altura}%` }}
                                title={`${dia}: ${valorFormatado(item.valor, relatorioSelecionado.grafico.formato)}`}
                              />
                            )}
                          </div>
                          <span>{dia.slice(0, 2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="reports-ranking-chart" role="list">
                  {grafico.map((item, indice) => (
                    <div className="reports-ranking-row" key={`${item.rotulo}-${indice}`} role="listitem">
                      <span className="reports-ranking-label" title={item.rotulo}>{item.rotulo}</span>
                      <div className="reports-ranking-track">
                        <span style={{ width: `${maximoGrafico > 0 ? (item.valor / maximoGrafico) * 100 : 0}%` }} />
                      </div>
                      <strong>{valorFormatado(item.valor, relatorioSelecionado.grafico.formato)}</strong>
                    </div>
                  ))}
                </div>
              )}
              {relatorioSelecionado.grafico.tipo === 'ranking' && linhas.length > grafico.length && (
                <p className="reports-chart-note">Exibindo os {grafico.length} primeiros de {linhas.length} registros. A tabela abaixo contém o relatório completo.</p>
              )}
            </section>
          )}

          <section className="reports-results">
            <div className="reports-results-heading">
              <div>
                <strong>{linhas.length.toLocaleString('pt-BR')}</strong>
                <span>{linhas.length === 1 ? 'registro' : 'registros'}</span>
              </div>
              <small>Dados completos do relatório</small>
            </div>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    {relatorioSelecionado.colunas.map((coluna) => <th key={coluna.chave}>{coluna.rotulo}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha, indice) => (
                    <tr key={`${String(linha.id_venda ?? linha.produto ?? linha.cliente ?? linha.vendedor ?? linha.dia ?? linha.categoria ?? indice)}-${indice}`}>
                      {relatorioSelecionado.colunas.map((coluna) => (
                        <td key={coluna.chave}>{valorFormatado(linha[coluna.chave], coluna.formato)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default ReportsPage
