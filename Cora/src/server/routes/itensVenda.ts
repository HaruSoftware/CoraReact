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

router.post('/', autenticar, (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Itens são registrados junto com a venda.',
  })
})

router.put('/:id', autenticar, (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Itens de uma venda registrada não podem ser alterados.',
  })
})

router.delete('/:id', autenticar, (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Itens de uma venda registrada não podem ser excluídos.',
  })
})

export default router