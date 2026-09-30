import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

type ItemSolicitado = {
  id_produto: number
  quantidade: number
}

function converterPrecoParaCentavos(preco: string | number) {
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(preco))
  if (!partes) return null

  const valor = Number(partes[1]) * 100 + Number((partes[2] ?? '').padEnd(2, '0'))
  return Number.isSafeInteger(valor) ? valor : null
}

function formatarCentavos(valor: number) {
  return `${Math.floor(valor / 100)}.${String(valor % 100).padStart(2, '0')}`
}

function validarPercentual(valor: unknown) {
  const percentual = Number(valor)
  return Number.isFinite(percentual)
    && percentual >= 0
    && percentual <= 100
    && Math.abs(percentual * 100 - Math.round(percentual * 100)) < 1e-8
}

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT venda.id_venda, venda.id_cliente, venda.id_usuario,
          venda.data, venda.valor_subtotal, venda.desconto_percentual,
          venda.valor_desconto, venda.valor_total, cliente.nome AS nome_cliente,
          usuario.nome AS nome_usuario,
              COALESCE(SUM(item_venda.quantidade), 0)::int AS quantidade_itens
       FROM venda
       JOIN cliente ON cliente.id_cliente = venda.id_cliente
           AND cliente.id_conta = venda.id_conta
       JOIN usuario ON usuario.id_usuario = venda.id_usuario
           AND usuario.id_conta = venda.id_conta
       LEFT JOIN item_venda ON item_venda.id_venda = venda.id_venda
       WHERE venda.id_conta = $1
       GROUP BY venda.id_venda, cliente.nome, usuario.nome
       ORDER BY venda.data DESC, venda.id_venda DESC`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vendas.',
    })
  }
})

router.get('/:id', autenticar, async (req, res) => {
  const idVenda = Number(req.params.id)
  const { id_conta } = (req as AuthRequest).usuario!

  if (!Number.isInteger(idVenda) || idVenda <= 0) {
    return res.status(400).json({ success: false, message: 'Venda inválida.' })
  }

  try {
    const vendaResult = await pool.query(
      `SELECT venda.id_venda, venda.id_cliente, venda.id_usuario, venda.data,
              venda.valor_subtotal, venda.desconto_percentual,
              venda.valor_desconto, venda.valor_total,
              cliente.nome AS nome_cliente,
              usuario.nome AS nome_usuario
       FROM venda
       JOIN cliente ON cliente.id_cliente = venda.id_cliente
                   AND cliente.id_conta = venda.id_conta
       JOIN usuario ON usuario.id_usuario = venda.id_usuario
                   AND usuario.id_conta = venda.id_conta
       WHERE venda.id_venda = $1 AND venda.id_conta = $2`,
      [idVenda, id_conta]
    )

    if (vendaResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Venda não encontrada.' })
    }

    const itensResult = await pool.query(
      `SELECT item_venda.id_item_venda, item_venda.id_produto,
              produto.nome AS nome_produto, item_venda.quantidade,
              item_venda.preco_venda,
              item_venda.quantidade * item_venda.preco_venda AS subtotal
       FROM item_venda
       JOIN venda ON venda.id_venda = item_venda.id_venda
                 AND venda.id_conta = $2
       JOIN produto ON produto.id_produto = item_venda.id_produto
                   AND produto.id_conta = venda.id_conta
       WHERE item_venda.id_venda = $1
       ORDER BY item_venda.id_item_venda`,
      [idVenda, id_conta]
    )

    res.json({ ...vendaResult.rows[0], itens: itensResult.rows })
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error)
    res.status(500).json({ success: false, message: 'Erro ao buscar detalhes da venda.' })
  }
})

router.post('/', autenticar, async (req, res) => {
  const request = req as AuthRequest
  const id_conta = request.usuario!.id_conta
  const id_usuario = request.usuario!.id_usuario
  const id_cliente = Number(req.body.id_cliente)
  const descontoRecebido = req.body.desconto_percentual
  const itensRecebidos = req.body.itens

  if (!Number.isInteger(id_cliente) || id_cliente <= 0) {
    return res.status(400).json({ success: false, message: 'Selecione um cliente válido.' })
  }

  if (descontoRecebido !== undefined && !validarPercentual(descontoRecebido)) {
    return res.status(400).json({
      success: false,
      message: 'O desconto da venda deve estar entre 0% e 100%, com até duas casas decimais.',
    })
  }

  if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0 || itensRecebidos.length > 100) {
    return res.status(400).json({ success: false, message: 'Adicione entre 1 e 100 itens à venda.' })
  }

  const quantidades = new Map<number, number>()
  for (const item of itensRecebidos) {
    const idProduto = Number(item?.id_produto)
    const quantidade = Number(item?.quantidade)

    if (!Number.isInteger(idProduto) || idProduto <= 0 || !Number.isInteger(quantidade) || quantidade <= 0 || quantidade > 100000) {
      return res.status(400).json({ success: false, message: 'Produto ou quantidade inválidos.' })
    }

    const quantidadeAcumulada = (quantidades.get(idProduto) ?? 0) + quantidade
    if (quantidadeAcumulada > 100000) {
      return res.status(400).json({ success: false, message: 'Quantidade máxima por produto excedida.' })
    }
    quantidades.set(idProduto, quantidadeAcumulada)
  }

  const itens: ItemSolicitado[] = Array.from(quantidades, ([id_produto, quantidade]) => ({ id_produto, quantidade }))
  const client = await pool.connect()
  let transacaoIniciada = false

  try {
    await client.query('BEGIN')
    transacaoIniciada = true

    const cliente = await client.query(
      `SELECT id_cliente, desconto_percentual
       FROM cliente
       WHERE id_cliente = $1 AND id_conta = $2
      FOR SHARE`,
      [id_cliente, id_conta]
    )

    if (cliente.rows.length === 0) {
      await client.query('ROLLBACK')
      transacaoIniciada = false
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado para esta conta.',
      })
    }

    const descontoPercentual = descontoRecebido === undefined
      ? Number(cliente.rows[0].desconto_percentual)
      : Number(descontoRecebido)

    const produtosResult = await client.query(
      `SELECT id_produto, nome, preco, estoque
       FROM produto
       WHERE id_conta = $1
         AND ativo = TRUE
         AND id_produto = ANY($2::integer[])
       ORDER BY id_produto
       FOR UPDATE`,
      [id_conta, itens.map((item) => item.id_produto).sort((a, b) => a - b)]
    )

    if (produtosResult.rows.length !== itens.length) {
      await client.query('ROLLBACK')
      transacaoIniciada = false
      return res.status(400).json({
        success: false,
        message: 'Um ou mais produtos não estão disponíveis nesta conta.',
      })
    }

    const produtos = new Map<number, { nome: string; preco: string; estoque: number }>(
      produtosResult.rows.map((produto) => [produto.id_produto, produto])
    )
    const itensCalculados = []
    let totalCentavos = 0

    for (const item of itens) {
      const produto = produtos.get(item.id_produto)!
      if (produto.estoque < item.quantidade) {
        await client.query('ROLLBACK')
        transacaoIniciada = false
        return res.status(409).json({
          success: false,
          message: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`,
        })
      }

      const precoCentavos = converterPrecoParaCentavos(produto.preco)
      if (precoCentavos === null) {
        throw new Error(`Preço inválido cadastrado no produto ${item.id_produto}.`)
      }

      const subtotalCentavos = precoCentavos * item.quantidade
      totalCentavos += subtotalCentavos
      if (!Number.isSafeInteger(totalCentavos) || totalCentavos > 9_999_999_999) {
        await client.query('ROLLBACK')
        transacaoIniciada = false
        return res.status(400).json({ success: false, message: 'O total da venda excede o limite permitido.' })
      }

      itensCalculados.push({
        ...item,
        nome_produto: produto.nome,
        preco_venda: formatarCentavos(precoCentavos),
        subtotal: formatarCentavos(subtotalCentavos),
      })
    }

    const valorDescontoCentavos = Math.round(totalCentavos * Math.round(descontoPercentual * 100) / 10000)
    const totalLiquidoCentavos = totalCentavos - valorDescontoCentavos

    const vendaResult = await client.query(
      `INSERT INTO venda (
         id_conta, id_cliente, id_usuario, valor_subtotal,
         desconto_percentual, valor_desconto, valor_total
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_venda, id_cliente, id_usuario, data, valor_subtotal,
                 desconto_percentual, valor_desconto, valor_total`,
      [
        id_conta,
        id_cliente,
        id_usuario,
        formatarCentavos(totalCentavos),
        descontoPercentual.toFixed(2),
        formatarCentavos(valorDescontoCentavos),
        formatarCentavos(totalLiquidoCentavos),
      ]
    )
    const venda = vendaResult.rows[0]

    for (const item of itensCalculados) {
      await client.query(
        `INSERT INTO item_venda (id_venda, id_produto, quantidade, preco_venda)
         VALUES ($1, $2, $3, $4)`,
        [venda.id_venda, item.id_produto, item.quantidade, item.preco_venda]
      )
      await client.query(
        `UPDATE produto
         SET estoque = estoque - $1, data_atualizacao = CURRENT_TIMESTAMP
         WHERE id_produto = $2 AND id_conta = $3`,
        [item.quantidade, item.id_produto, id_conta]
      )
    }

    await client.query('COMMIT')
    transacaoIniciada = false

    return res.status(201).json({ venda, itens: itensCalculados })
  } catch (error) {
    if (transacaoIniciada) await client.query('ROLLBACK').catch(() => undefined)
    console.error('Erro ao criar venda:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar venda.',
    })
  } finally {
    client.release()
  }
})

router.put('/:id', autenticar, (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Vendas registradas não podem ser alteradas.',
  })
})

router.delete('/:id', autenticar, (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Vendas não podem ser excluídas por esta operação.',
  })
})

export default router