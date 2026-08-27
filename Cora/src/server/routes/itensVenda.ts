import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT iv.id_item_venda,
              iv.id_venda,
              iv.id_produto,
              iv.quantidade,
              iv.preco_venda
       FROM item_venda iv
       INNER JOIN venda v ON v.id_venda = iv.id_venda
       WHERE v.id_conta = $1
       ORDER BY iv.id_item_venda`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar itens de venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar itens de venda.',
    })
  }
})

router.post('/', autenticar, async (req, res) => {
  try {
    const {
      id_venda,
      id_produto,
      quantidade,
      preco_venda
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !id_venda ||
      !id_produto ||
      !quantidade ||
      preco_venda === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Venda, produto, quantidade e preço são obrigatórios.',
      })
    }

    const venda = await pool.query(
      `SELECT id_venda
       FROM venda
       WHERE id_venda = $1
       AND id_conta = $2`,
      [id_venda, id_conta]
    )

    if (venda.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Venda não encontrada para esta conta.',
      })
    }

    const produto = await pool.query(
      `SELECT id_produto
       FROM produto
       WHERE id_produto = $1
       AND id_conta = $2`,
      [id_produto, id_conta]
    )

    if (produto.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Produto não encontrado para esta conta.',
      })
    }

    const result = await pool.query(
      `INSERT INTO item_venda (
        id_venda,
        id_produto,
        quantidade,
        preco_venda
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id_item_venda, id_venda, id_produto, quantidade, preco_venda`,
      [
        id_venda,
        id_produto,
        quantidade,
        preco_venda
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar item de venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar item de venda.',
    })
  }
})

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const {
      id_venda,
      id_produto,
      quantidade,
      preco_venda
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !id_venda ||
      !id_produto ||
      !quantidade ||
      preco_venda === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Venda, produto, quantidade e preço são obrigatórios.',
      })
    }

    const venda = await pool.query(
      `SELECT id_venda
       FROM venda
       WHERE id_venda = $1
       AND id_conta = $2`,
      [id_venda, id_conta]
    )

    if (venda.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Venda não encontrada para esta conta.',
      })
    }

    const produto = await pool.query(
      `SELECT id_produto
       FROM produto
       WHERE id_produto = $1
       AND id_conta = $2`,
      [id_produto, id_conta]
    )

    if (produto.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Produto não encontrado para esta conta.',
      })
    }

    const result = await pool.query(
      `UPDATE item_venda
       SET id_venda = $1,
           id_produto = $2,
           quantidade = $3,
           preco_venda = $4
       WHERE id_item_venda = $5
       AND id_venda IN (
         SELECT id_venda
         FROM venda
         WHERE id_conta = $6
       )
       RETURNING id_item_venda, id_venda, id_produto, quantidade, preco_venda`,
      [
        id_venda,
        id_produto,
        quantidade,
        preco_venda,
        id,
        id_conta
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item de venda não encontrado.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar item de venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar item de venda.',
    })
  }
})

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM item_venda
       WHERE id_item_venda = $1
       AND id_venda IN (
         SELECT id_venda
         FROM venda
         WHERE id_conta = $2
       )
       RETURNING id_item_venda`,
      [id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item de venda não encontrado.',
      })
    }

    res.json({
      success: true,
      message: 'Item de venda excluído com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir item de venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir item de venda.',
    })
  }
})

export default router