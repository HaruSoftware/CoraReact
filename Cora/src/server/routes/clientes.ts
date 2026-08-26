import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_cliente, id_conta, nome, cpf, telefone, email
       FROM cliente
       ORDER BY id_cliente`
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes.',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { id_conta, nome, cpf, telefone, email } = req.body

    if (!id_conta || !nome || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Conta, nome e CPF são obrigatórios.',
      })
    }

    const result = await pool.query(
      `INSERT INTO cliente (
        id_conta,
        nome,
        cpf,
        telefone,
        email
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_cliente, id_conta, nome, cpf, telefone, email`,
      [id_conta, nome, cpf, telefone, email]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar cliente.',
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { id_conta, nome, cpf, telefone, email } = req.body

    if (!id_conta || !nome || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Conta, nome e CPF são obrigatórios.',
      })
    }

    const result = await pool.query(
      `UPDATE cliente
       SET id_conta = $1,
           nome = $2,
           cpf = $3,
           telefone = $4,
           email = $5
       WHERE id_cliente = $6
       RETURNING id_cliente, id_conta, nome, cpf, telefone, email`,
      [id_conta, nome, cpf, telefone, email, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cliente.',
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `DELETE FROM cliente
       WHERE id_cliente = $1
       RETURNING id_cliente`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      })
    }

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir cliente.',
    })
  }
})

export default router