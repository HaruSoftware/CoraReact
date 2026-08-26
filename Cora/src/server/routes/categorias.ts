import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (_req, res) => {

  try {

    const request = _req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT id_categoria, id_conta, nome
      FROM categoria
      WHERE id_conta = $1
      ORDER BY id_categoria`,
      [id_conta]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias.',
    })
  }
})

router.post('/', autenticar, async (req, res) => {
  try {
    const { nome } = req.body
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório.',
      })
    }

    const result = await pool.query(
      `INSERT INTO categoria (id_conta, nome)
       VALUES ($1, $2)
       RETURNING id_categoria, id_conta, nome`,
      [id_conta, nome]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar categoria:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar categoria.',
    })
  }
})

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params
    const { nome } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'Conta e nome são obrigatórios.',
      })
    }

    const result = await pool.query(
      `UPDATE categoria
       SET id_conta = $1,
           nome = $2
       WHERE id_categoria = $3
        AND id_conta = $1
       RETURNING id_categoria, id_conta, nome`,
      [id_conta, nome, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar categoria.',
    })
  }
})

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM categoria
       WHERE id_categoria = $1
       AND id_conta = $2
       RETURNING id_categoria`,
      [id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada.',
      })
    }

    res.json({
      success: true,
      message: 'Categoria excluída com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir categoria.',
    })
  }
})

export default router