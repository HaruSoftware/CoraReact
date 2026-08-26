import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_item_venda, id_venda, id_produto, quantidade, preco_venda
       FROM item_venda
       ORDER BY id_item_venda`
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

router.post('/', async (req, res) => {
  try {
    const {
      id_venda,
      id_produto,
      quantidade,
      preco_venda
    } = req.body

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

export default router