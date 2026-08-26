import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_venda, id_conta, id_cliente, id_usuario, data, valor_total
       FROM venda
       ORDER BY id_venda`
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

router.post('/', async (req, res) => {
  try {
    const {
      id_conta,
      id_cliente,
      id_usuario,
      valor_total
    } = req.body

    if (
      !id_conta ||
      !id_cliente ||
      !id_usuario ||
      valor_total === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Conta, cliente, usuário e valor total são obrigatórios.',
      })
    }

    const result = await pool.query(
      `INSERT INTO venda (
        id_conta,
        id_cliente,
        id_usuario,
        valor_total
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id_venda, id_conta, id_cliente, id_usuario, data, valor_total`,
      [
        id_conta,
        id_cliente,
        id_usuario,
        valor_total
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar venda.',
    })
  }
})

export default router