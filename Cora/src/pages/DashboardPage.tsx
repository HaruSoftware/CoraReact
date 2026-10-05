import { useEffect, useMemo, useState } from 'react'
import { FiArrowUpRight, FiDollarSign, FiPackage, FiRefreshCw, FiShoppingCart, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContextValue'
import { api } from '../services/api'
import './DashboardPage.css'

type DashboardData = {
  resumo: {
    quantidade_vendas: number | string
    faturamento: number | string
    ticket_medio: number | string
    quantidade_vendas_anterior: number | string
    faturamento_anterior: number | string
    ticket_medio_anterior: number | string
    unidades_vendidas: number | string
  }
  vendasPorDia: Array<{
    data: string
    quantidade_vendas: number | string
    faturamento: number | string
  }>
  produtosMaisVendidos: Array<{
    id_produto: number
    nome: string
    quantidade_vendida: number | string
    faturamento: number | string
  }>
  vendedores: Array<{
    id_usuario: number
    nome: string
    quantidade_vendas: number | string
    faturamento: number | string
  }>
  vendasRecentes: Array<{
    id_venda: number
    data: string
    valor_total: number | string
    nome_cliente: string
    nome_usuario: string
  }>
}

const PERIODOS = [
  { dias: 7, rotulo: 'Últimos 7 dias' },
  { dias: 30, rotulo: 'Últimos 30 dias' },
  { dias: 90, rotulo: 'Últimos 90 dias' },
]

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarNumero(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR')
}

function formatarDia(data: string, periodo: number, indice: number) {
  if (periodo === 7) {
    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })
  }
  if (indice !== 0 && indice !== periodo - 1 && indice % (periodo === 30 ? 5 : 14) !== 0) return ''
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function compararComAnterior(atual: number | string, anterior: number | string) {
  const valorAtual = Number(atual)
  const valorAnterior = Number(anterior)
  if (valorAnterior === 0) return valorAtual > 0 ? 'Primeiro resultado neste período' : 'Sem resultado no período anterior'

  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
  const sinal = variacao > 0 ? '+' : ''
  return `${sinal}${variacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs. período anterior`
}

function DashboardPage() {
  const { usuario } = useAuth()
  const [periodo, setPeriodo] = useState(30)
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true

    api(`/dashboard?dias=${periodo}`)
      .then((resultado) => {
        if (ativo) setDados(resultado)
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar os dados do dashboard:', error)
        if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível carregar o dashboard.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [periodo, tentativa])

  const maiorQuantidadeVendasDiaria = useMemo(
    () => Math.max(...(dados?.vendasPorDia.map((dia) => Number(dia.quantidade_vendas)) ?? [0]), 1),
    [dados]
  )
  const maiorQuantidadeProduto = useMemo(
    () => Math.max(...(dados?.produtosMaisVendidos.map((produto) => Number(produto.quantidade_vendida)) ?? [0]), 1),
    [dados]
  )

  const selecionado = PERIODOS.find((opcao) => opcao.dias === periodo)?.rotulo ?? 'Período selecionado'

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">Visão geral</span>
          <h1>Olá, {usuario?.nome}!</h1>
          <p>Acompanhe os resultados e as vendas do seu negócio.</p>
        </div>
        <label className="dashboard-period">
          <span>Período</span>
          <select
            value={periodo}
            onChange={(event) => {
              setCarregando(true)
              setErro('')
              setDados(null)
              setPeriodo(Number(event.target.value))
            }}
          >
            {PERIODOS.map((opcao) => (
              <option key={opcao.dias} value={opcao.dias}>{opcao.rotulo}</option>
            ))}
          </select>
        </label>
      </header>

      {erro ? (
        <section className="dashboard-message dashboard-error" role="alert">
          <div>
            <strong>Não foi possível carregar o dashboard</strong>
            <p>{erro}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCarregando(true)
              setErro('')
              setDados(null)
              setTentativa((valor) => valor + 1)
            }}
          >
            <FiRefreshCw aria-hidden="true" /> Tentar novamente
          </button>
        </section>
      ) : carregando && !dados ? (
        <div className="dashboard-loading" role="status">Carregando indicadores...</div>
      ) : dados ? (
        <>
          <section className="dashboard-kpis" aria-label={`Indicadores: ${selecionado}`}>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi-icon"><FiDollarSign aria-hidden="true" /></span>
              <div>
                <span className="dashboard-kpi-label">Faturamento</span>
                <strong>{formatarMoeda(dados.resumo.faturamento)}</strong>
                <small>{compararComAnterior(dados.resumo.faturamento, dados.resumo.faturamento_anterior)}</small>
              </div>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi-icon"><FiShoppingCart aria-hidden="true" /></span>
              <div>
                <span className="dashboard-kpi-label">Vendas realizadas</span>
                <strong>{formatarNumero(dados.resumo.quantidade_vendas)}</strong>
                <small>{compararComAnterior(dados.resumo.quantidade_vendas, dados.resumo.quantidade_vendas_anterior)}</small>
              </div>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi-icon"><FiArrowUpRight aria-hidden="true" /></span>
              <div>
                <span className="dashboard-kpi-label">Ticket médio</span>
                <strong>{formatarMoeda(dados.resumo.ticket_medio)}</strong>
                <small>{compararComAnterior(dados.resumo.ticket_medio, dados.resumo.ticket_medio_anterior)}</small>
              </div>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi-icon"><FiPackage aria-hidden="true" /></span>
              <div>
                <span className="dashboard-kpi-label">Unidades vendidas</span>
                <strong>{formatarNumero(dados.resumo.unidades_vendidas)}</strong>
                <small>{selecionado}</small>
              </div>
            </article>
          </section>

          <section className="dashboard-panels">
            <article className="dashboard-panel dashboard-sales-chart">
              <div className="dashboard-panel-heading">
                <div>
                  <span>Desempenho</span>
                  <h2>Vendas por dia</h2>
                </div>
                <span className="dashboard-period-note">{selecionado}</span>
              </div>
              {Number(dados.resumo.quantidade_vendas) === 0 ? (
                <div className="dashboard-empty">Nenhuma venda neste período. Assim que houver vendas, o gráfico aparecerá aqui.</div>
              ) : (
                <div className="dashboard-chart" role="img" aria-label={`Quantidade de vendas por dia nos ${periodo} dias selecionados`}>
                  {dados.vendasPorDia.map((dia, indice) => {
                    const quantidade = Number(dia.quantidade_vendas)
                    const altura = quantidade === 0 ? 0 : Math.max((quantidade / maiorQuantidadeVendasDiaria) * 100, 3)
                    return (
                      <div className="dashboard-chart-column" key={dia.data}>
                        <div className="dashboard-bar-track">
                          {quantidade > 0 && (
                            <div
                              className="dashboard-bar"
                              style={{ height: `${altura}%` }}
                              title={`${new Date(`${dia.data}T12:00:00`).toLocaleDateString('pt-BR')}: ${formatarNumero(quantidade)} ${quantidade === 1 ? 'venda' : 'vendas'} · ${formatarMoeda(dia.faturamento)}`}
                            />
                          )}
                        </div>
                        <span>{formatarDia(dia.data, periodo, indice)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="dashboard-chart-legend">
                <span><i aria-hidden="true" /> Vendas</span>
                <strong>{formatarNumero(dados.resumo.quantidade_vendas)}</strong>
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span>Campeões de venda</span>
                  <h2>Produtos mais vendidos</h2>
                </div>
              </div>
              {dados.produtosMaisVendidos.length === 0 ? (
                <div className="dashboard-empty">Ainda não há produtos vendidos neste período.</div>
              ) : (
                <ol className="dashboard-ranking">
                  {dados.produtosMaisVendidos.map((produto, indice) => {
                    const quantidade = Number(produto.quantidade_vendida)
                    return (
                      <li key={produto.id_produto}>
                        <span className="dashboard-rank-number">{indice + 1}</span>
                        <div className="dashboard-ranking-content">
                          <div className="dashboard-ranking-title">
                            <strong>{produto.nome}</strong>
                            <span>{formatarNumero(quantidade)} un.</span>
                          </div>
                          <div className="dashboard-rank-track">
                            <span style={{ width: `${(quantidade / maiorQuantidadeProduto) * 100}%` }} />
                          </div>
                          <small>{formatarMoeda(produto.faturamento)} em vendas</small>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </article>
          </section>

          <section className="dashboard-panels dashboard-panels-bottom">
            <article className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span>Equipe</span>
                  <h2>Vendedores em destaque</h2>
                </div>
                <FiUsers className="dashboard-heading-icon" aria-hidden="true" />
              </div>
              {dados.vendedores.length === 0 ? (
                <div className="dashboard-empty">Ainda não há vendas atribuídas a vendedores neste período.</div>
              ) : (
                <ol className="dashboard-seller-list">
                  {dados.vendedores.map((vendedor, indice) => (
                    <li key={vendedor.id_usuario}>
                      <span className={`dashboard-seller-avatar ${indice === 0 ? 'is-top-seller' : ''}`}>
                        {vendedor.nome.trim().charAt(0).toLocaleUpperCase()}
                      </span>
                      <div>
                        <strong>{vendedor.nome}</strong>
                        <small>{formatarNumero(vendedor.quantidade_vendas)} {Number(vendedor.quantidade_vendas) === 1 ? 'venda' : 'vendas'}</small>
                      </div>
                      <b>{formatarMoeda(vendedor.faturamento)}</b>
                    </li>
                  ))}
                </ol>
              )}
            </article>

            <article className="dashboard-panel dashboard-recent-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span>Movimentação</span>
                  <h2>Vendas recentes</h2>
                </div>
                <Link to="/vendas" className="dashboard-link">Ver vendas</Link>
              </div>
              {dados.vendasRecentes.length === 0 ? (
                <div className="dashboard-empty">As vendas registradas neste período aparecerão aqui.</div>
              ) : (
                <ul className="dashboard-recent-list">
                  {dados.vendasRecentes.map((venda) => (
                    <li key={venda.id_venda}>
                      <div className="dashboard-recent-sale">
                        <strong>{venda.nome_cliente}</strong>
                        <small>#{venda.id_venda} · {formatarDataHora(venda.data)} · {venda.nome_usuario}</small>
                      </div>
                      <b>{formatarMoeda(venda.valor_total)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default DashboardPage
