import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()
const PERIODOS_VALIDOS = new Set([7, 30, 90])

router.get('/', autenticar, async (req, res) => {
  const dias = req.query.dias === undefined ? 30 : Number(req.query.dias)
  if (!Number.isInteger(dias) || !PERIODOS_VALIDOS.has(dias)) {
    return res.status(400).json({
      success: false,
      message: 'Selecione um período válido: 7, 30 ou 90 dias.',
    })
  }

  const { id_conta } = (req as AuthRequest).usuario!

  try {
    const [resumo, vendasPorDia, produtosMaisVendidos, vendedores, vendasRecentes] = await Promise.all([
      pool.query(
        `WITH periodo AS (
           SELECT date_trunc('day', CURRENT_TIMESTAMP) - ($2::int - 1) * INTERVAL '1 day' AS inicio,
                  date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' AS fim,
                  $2::int * INTERVAL '1 day' AS duracao
         )
         SELECT
           COUNT(*) FILTER (WHERE venda.data >= periodo.inicio AND venda.data < periodo.fim) AS quantidade_vendas,
           COALESCE(SUM(venda.valor_total) FILTER (
             WHERE venda.data >= periodo.inicio AND venda.data < periodo.fim
           ), 0) AS faturamento,
           COALESCE(AVG(venda.valor_total) FILTER (
             WHERE venda.data >= periodo.inicio AND venda.data < periodo.fim
           ), 0) AS ticket_medio,
           COUNT(*) FILTER (
             WHERE venda.data >= periodo.inicio - periodo.duracao
               AND venda.data < periodo.inicio
           ) AS quantidade_vendas_anterior,
           COALESCE(SUM(venda.valor_total) FILTER (
             WHERE venda.data >= periodo.inicio - periodo.duracao
               AND venda.data < periodo.inicio
           ), 0) AS faturamento_anterior,
           COALESCE(AVG(venda.valor_total) FILTER (
             WHERE venda.data >= periodo.inicio - periodo.duracao
               AND venda.data < periodo.inicio
           ), 0) AS ticket_medio_anterior,
           COALESCE((
             SELECT SUM(item_venda.quantidade)
             FROM venda AS venda_itens
             JOIN item_venda ON item_venda.id_venda = venda_itens.id_venda
             WHERE venda_itens.id_conta = $1
               AND venda_itens.data >= periodo.inicio
               AND venda_itens.data < periodo.fim
           ), 0) AS unidades_vendidas
         FROM periodo
         LEFT JOIN venda ON venda.id_conta = $1
           AND venda.data >= periodo.inicio - periodo.duracao
           AND venda.data < periodo.fim
         GROUP BY periodo.inicio, periodo.fim, periodo.duracao`,
        [id_conta, dias]
      ),
      pool.query(
        `WITH periodo AS (
           SELECT date_trunc('day', CURRENT_TIMESTAMP) - ($2::int - 1) * INTERVAL '1 day' AS inicio,
                  date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' AS fim
         ),
         dias AS (
           SELECT generate_series(periodo.inicio, periodo.fim - INTERVAL '1 day', INTERVAL '1 day') AS dia
           FROM periodo
         )
         SELECT to_char(dias.dia, 'YYYY-MM-DD') AS data,
                COUNT(venda.id_venda) AS quantidade_vendas,
                COALESCE(SUM(venda.valor_total), 0) AS faturamento
         FROM dias
         LEFT JOIN venda ON venda.id_conta = $1
           AND venda.data >= dias.dia
           AND venda.data < dias.dia + INTERVAL '1 day'
         GROUP BY dias.dia
         ORDER BY dias.dia`,
        [id_conta, dias]
      ),
      pool.query(
        `WITH periodo AS (
           SELECT date_trunc('day', CURRENT_TIMESTAMP) - ($2::int - 1) * INTERVAL '1 day' AS inicio,
                  date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' AS fim
         )
         SELECT produto.id_produto, produto.nome,
                SUM(item_venda.quantidade) AS quantidade_vendida,
                SUM(item_venda.quantidade * item_venda.preco_venda) AS faturamento
         FROM venda
         JOIN item_venda ON item_venda.id_venda = venda.id_venda
         JOIN produto ON produto.id_produto = item_venda.id_produto
           AND produto.id_conta = venda.id_conta
         CROSS JOIN periodo
         WHERE venda.id_conta = $1
           AND venda.data >= periodo.inicio
           AND venda.data < periodo.fim
         GROUP BY produto.id_produto, produto.nome
         ORDER BY quantidade_vendida DESC, faturamento DESC, produto.nome
         LIMIT 5`,
        [id_conta, dias]
      ),
      pool.query(
        `WITH periodo AS (
           SELECT date_trunc('day', CURRENT_TIMESTAMP) - ($2::int - 1) * INTERVAL '1 day' AS inicio,
                  date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' AS fim
         )
         SELECT usuario.id_usuario, usuario.nome,
                COUNT(venda.id_venda) AS quantidade_vendas,
                COALESCE(SUM(venda.valor_total), 0) AS faturamento
         FROM venda
         JOIN usuario ON usuario.id_usuario = venda.id_usuario
           AND usuario.id_conta = venda.id_conta
         CROSS JOIN periodo
         WHERE venda.id_conta = $1
           AND venda.data >= periodo.inicio
           AND venda.data < periodo.fim
         GROUP BY usuario.id_usuario, usuario.nome
         ORDER BY quantidade_vendas DESC, faturamento DESC, usuario.nome
         LIMIT 5`,
        [id_conta, dias]
      ),
      pool.query(
        `WITH periodo AS (
           SELECT date_trunc('day', CURRENT_TIMESTAMP) - ($2::int - 1) * INTERVAL '1 day' AS inicio,
                  date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' AS fim
         )
         SELECT venda.id_venda, venda.data, venda.valor_total,
                cliente.nome AS nome_cliente, usuario.nome AS nome_usuario
         FROM venda
         JOIN cliente ON cliente.id_cliente = venda.id_cliente
           AND cliente.id_conta = venda.id_conta
         JOIN usuario ON usuario.id_usuario = venda.id_usuario
           AND usuario.id_conta = venda.id_conta
         CROSS JOIN periodo
         WHERE venda.id_conta = $1
           AND venda.data >= periodo.inicio
           AND venda.data < periodo.fim
         ORDER BY venda.data DESC, venda.id_venda DESC
         LIMIT 5`,
        [id_conta, dias]
      ),
    ])

    res.json({
      resumo: resumo.rows[0],
      vendasPorDia: vendasPorDia.rows,
      produtosMaisVendidos: produtosMaisVendidos.rows,
      vendedores: vendedores.rows,
      vendasRecentes: vendasRecentes.rows,
    })
  } catch (error) {
    console.error('Erro ao carregar o dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar os dados do dashboard.',
    })
  }
})

export default router
