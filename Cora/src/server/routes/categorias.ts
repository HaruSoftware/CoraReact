import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categoria ORDER BY id_categoria'
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

router.post('/', async (req, res) => {
  try {
    const { nome } = req.body

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório.',
      })
    }

    const result = await pool.query(
      'INSERT INTO categoria (nome) VALUES ($1) RETURNING *',
      [nome]
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nome } = req.body

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'O nome da categoria é obrigatório.',
      })
    }

    const result = await pool.query(
      'UPDATE categoria SET nome = $1 WHERE id_categoria = $2 RETURNING *',
      [nome, id]
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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM categoria WHERE id_categoria = $1 RETURNING *',
      [id]
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