import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_produto, id_conta, nome, descricao, preco, estoque, id_categoria
       FROM produto
       ORDER BY id_produto`
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos.',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      id_conta,
      nome,
      descricao,
      preco,
      estoque,
      id_categoria
    } = req.body

    if (
      !id_conta ||
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Conta, nome, preço, estoque e categoria são obrigatórios.',
      })
    }

    const result = await pool.query(
      `INSERT INTO produto (
        id_conta,
        nome,
        descricao,
        preco,
        estoque,
        id_categoria
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_produto, id_conta, nome, descricao, preco, estoque, id_categoria`,
      [
        id_conta,
        nome,
        descricao,
        preco,
        estoque,
        id_categoria
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erro ao criar produto:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar produto.',
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      id_conta,
      nome,
      descricao,
      preco,
      estoque,
      id_categoria
    } = req.body

    if (
      !id_conta ||
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Conta, nome, preço, estoque e categoria são obrigatórios.',
      })
    }

    const result = await pool.query(
      `UPDATE produto
       SET id_conta = $1,
           nome = $2,
           descricao = $3,
           preco = $4,
           estoque = $5,
           id_categoria = $6
       WHERE id_produto = $7
       RETURNING id_produto, id_conta, nome, descricao, preco, estoque, id_categoria`,
      [
        id_conta,
        nome,
        descricao,
        preco,
        estoque,
        id_categoria,
        id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar produto.',
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `DELETE FROM produto
       WHERE id_produto = $1
       RETURNING id_produto`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado.',
      })
    }

    res.json({
      success: true,
      message: 'Produto excluído com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir produto.',
    })
  }
})

export default router