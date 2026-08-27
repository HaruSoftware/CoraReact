import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT id_cliente, id_conta, nome, cpf, telefone, email
       FROM cliente
       WHERE id_conta = $1
       ORDER BY id_cliente`,
      [id_conta]
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

router.post('/', autenticar, async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!nome || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Nome e CPF são obrigatórios.',
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

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, cpf, telefone, email } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!nome || !cpf) {
      return res.status(400).json({
        success: false,
        message: 'Nome e CPF são obrigatórios.',
      })
    }

    const result = await pool.query(
      `UPDATE cliente
       SET nome = $1,
           cpf = $2,
           telefone = $3,
           email = $4
       WHERE id_cliente = $5
       AND id_conta = $6
       RETURNING id_cliente, id_conta, nome, cpf, telefone, email`,
      [nome, cpf, telefone, email, id, id_conta]
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

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM cliente
       WHERE id_cliente = $1
       AND id_conta = $2
       RETURNING id_cliente`,
      [id, id_conta]
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