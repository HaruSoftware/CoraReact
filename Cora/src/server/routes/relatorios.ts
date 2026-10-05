import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

const TIPOS_RELATORIO = [
  'vendas',
  'financeiro',
  'produtos',
  'categorias',
  'vendedores',
  'clientes',
  'estoque',
] as const

type TipoRelatorio = typeof TIPOS_RELATORIO[number]

function tipoRelatorioValido(valor: unknown): valor is TipoRelatorio {
  return typeof valor === 'string' && TIPOS_RELATORIO.some((tipo) => tipo === valor)
}

function dataValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const data = new Date(`${valor}T00:00:00.000Z`)
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor
}

router.get('/:tipo', autenticar, async (req, res) => {
  const tipoParametro = req.params.tipo
  if (!tipoRelatorioValido(tipoParametro)) {
    return res.status(404).json({ success: false, message: 'Tipo de relatório não encontrado.' })
  }
  const tipo = tipoParametro

  const inicio = req.query.inicio
  const fim = req.query.fim
  if (tipo !== 'estoque' && (!dataValida(inicio) || !dataValida(fim) || inicio > fim)) {
    return res.status(400).json({
      success: false,
      message: 'Informe um período válido, com data inicial anterior ou igual à data final.',
    })
  }

  const id_conta = (req as AuthRequest).usuario!.id_conta
  const parametros = tipo === 'estoque' ? [id_conta] : [id_conta, inicio, fim]
  const periodo = `venda.data >= $2::date AND venda.data < $3::date + INTERVAL '1 day'`

  const consultas: Record<TipoRelatorio, string> = {
    vendas: `
      SELECT venda.id_venda, venda.data, cliente.nome AS cliente, usuario.nome AS vendedor,
             COALESCE(SUM(item_venda.quantidade), 0)::int AS quantidade_itens,
             venda.valor_subtotal AS subtotal, venda.valor_desconto AS desconto,
             venda.valor_total AS total
      FROM venda
      JOIN cliente ON cliente.id_cliente = venda.id_cliente AND cliente.id_conta = venda.id_conta
      JOIN usuario ON usuario.id_usuario = venda.id_usuario AND usuario.id_conta = venda.id_conta
      LEFT JOIN item_venda ON item_venda.id_venda = venda.id_venda
      WHERE venda.id_conta = $1 AND ${periodo}
      GROUP BY venda.id_venda, cliente.nome, usuario.nome
      ORDER BY venda.data DESC, venda.id_venda DESC`,
    financeiro: `
      WITH dias AS (
        SELECT generate_series($2::date, $3::date, INTERVAL '1 day')::date AS dia
      ),
      totais AS (
        SELECT venda.data::date AS dia, COUNT(*)::int AS vendas,
               SUM(venda.valor_subtotal) AS subtotal,
               SUM(venda.valor_desconto) AS descontos,
               SUM(venda.valor_total) AS faturamento,
               AVG(venda.valor_total) AS ticket_medio
        FROM venda
        WHERE venda.id_conta = $1 AND ${periodo}
        GROUP BY venda.data::date
      )
      SELECT dias.dia, COALESCE(totais.vendas, 0)::int AS vendas,
             COALESCE(totais.subtotal, 0) AS subtotal,
             COALESCE(totais.descontos, 0) AS descontos,
             COALESCE(totais.faturamento, 0) AS faturamento,
             COALESCE(totais.ticket_medio, 0) AS ticket_medio
      FROM dias
      LEFT JOIN totais ON totais.dia = dias.dia
      ORDER BY dias.dia`,
    produtos: `
      SELECT produto.codigo_interno AS codigo, produto.nome AS produto,
             categoria.nome AS categoria, SUM(item_venda.quantidade)::int AS unidades_vendidas,
             SUM(item_venda.quantidade * item_venda.preco_venda) AS faturamento
      FROM venda
      JOIN item_venda ON item_venda.id_venda = venda.id_venda
      JOIN produto ON produto.id_produto = item_venda.id_produto AND produto.id_conta = venda.id_conta
      JOIN categoria ON categoria.id_categoria = produto.id_categoria AND categoria.id_conta = venda.id_conta
      WHERE venda.id_conta = $1 AND ${periodo}
      GROUP BY produto.id_produto, produto.codigo_interno, produto.nome, categoria.nome
      ORDER BY unidades_vendidas DESC, faturamento DESC, produto.nome`,
    categorias: `
      SELECT categoria.nome AS categoria, COUNT(DISTINCT venda.id_venda)::int AS vendas,
             COUNT(DISTINCT produto.id_produto)::int AS produtos,
             SUM(item_venda.quantidade)::int AS unidades_vendidas,
             SUM(item_venda.quantidade * item_venda.preco_venda) AS faturamento
      FROM venda
      JOIN item_venda ON item_venda.id_venda = venda.id_venda
      JOIN produto ON produto.id_produto = item_venda.id_produto AND produto.id_conta = venda.id_conta
      JOIN categoria ON categoria.id_categoria = produto.id_categoria AND categoria.id_conta = venda.id_conta
      WHERE venda.id_conta = $1 AND ${periodo}
      GROUP BY categoria.id_categoria, categoria.nome
      ORDER BY faturamento DESC, categoria.nome`,
    vendedores: `
      SELECT usuario.nome AS vendedor, COUNT(venda.id_venda)::int AS vendas,
             COALESCE(SUM(venda.valor_total), 0) AS faturamento,
             COALESCE(AVG(venda.valor_total), 0) AS ticket_medio
      FROM venda
      JOIN usuario ON usuario.id_usuario = venda.id_usuario AND usuario.id_conta = venda.id_conta
      WHERE venda.id_conta = $1 AND ${periodo}
      GROUP BY usuario.id_usuario, usuario.nome
      ORDER BY faturamento DESC, vendas DESC, usuario.nome`,
    clientes: `
      SELECT cliente.nome AS cliente, cliente.tipo_pessoa AS tipo,
             COUNT(venda.id_venda)::int AS compras,
             COALESCE(SUM(venda.valor_total), 0) AS faturamento,
             COALESCE(AVG(venda.valor_total), 0) AS ticket_medio
      FROM venda
      JOIN cliente ON cliente.id_cliente = venda.id_cliente AND cliente.id_conta = venda.id_conta
      WHERE venda.id_conta = $1 AND ${periodo}
      GROUP BY cliente.id_cliente, cliente.nome, cliente.tipo_pessoa
      ORDER BY faturamento DESC, compras DESC, cliente.nome`,
    estoque: `
      SELECT produto.codigo_interno AS codigo, produto.nome AS produto,
             categoria.nome AS categoria, produto.estoque AS quantidade,
             produto.estoque_minimo AS estoque_minimo, produto.unidade_medida AS unidade,
             produto.preco AS preco_unitario,
             produto.estoque * produto.custo AS custo_em_estoque,
             produto.estoque * produto.preco AS valor_potencial_venda,
             CASE WHEN produto.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
             CASE WHEN produto.estoque <= produto.estoque_minimo THEN 'Abaixo do mínimo' ELSE 'Normal' END AS situacao
      FROM produto
      JOIN categoria ON categoria.id_categoria = produto.id_categoria AND categoria.id_conta = produto.id_conta
      WHERE produto.id_conta = $1
      ORDER BY (produto.estoque <= produto.estoque_minimo) DESC, produto.nome`,
  }

  try {
    const result = await pool.query(consultas[tipo], parametros)
    res.json({ rows: result.rows })
  } catch (error) {
    console.error(`Erro ao gerar relatório ${tipo}:`, error)
    res.status(500).json({
      success: false,
      message: 'Não foi possível gerar o relatório.',
    })
  }
})

export default router
