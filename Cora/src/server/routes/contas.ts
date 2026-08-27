import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT *
       FROM conta
       WHERE id_conta = $1`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conta.',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nome, email } = req.body

    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email são obrigatórios.',
      })
    }

    const result = await pool.query(
      `INSERT INTO conta (nome, email)
       VALUES ($1, $2)
       RETURNING *`,
      [nome, email]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta.',
    })
  }
})

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email são obrigatórios.',
      })
    }

    const result = await pool.query(
      `UPDATE conta
       SET nome = $1,
           email = $2
       WHERE id_conta = $3
       AND id_conta = $4
       RETURNING *`,
      [nome, email, id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar conta.',
    })
  }
})

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM conta
       WHERE id_conta = $1
       AND id_conta = $2
       RETURNING id_conta`,
      [id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    res.json({
      success: true,
      message: 'Conta excluída com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir conta.',
    })
  }
})

export default router