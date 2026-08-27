import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT id_produto, id_conta, nome, descricao, preco, estoque, id_categoria
      FROM produto
      WHERE id_conta = $1
      ORDER BY id_produto`,
      [id_conta]
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

router.post('/', autenticar, async (req, res) => {
  try {
    const {
      nome,
      descricao,
      preco,
      estoque,
      id_categoria
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço, estoque e categoria são obrigatórios.',
      })
    }

    const categoria = await pool.query(
      `SELECT id_categoria
       FROM categoria
       WHERE id_categoria = $1
       AND id_conta = $2`,
      [id_categoria, id_conta]
    )

    if (categoria.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categoria não encontrada para esta conta.',
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

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const {
      nome,
      descricao,
      preco,
      estoque,
      id_categoria
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço, estoque e categoria são obrigatórios.',
      })
    }

    const categoria = await pool.query(
      `SELECT id_categoria
       FROM categoria
       WHERE id_categoria = $1
       AND id_conta = $2`,
      [id_categoria, id_conta]
    )

    if (categoria.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categoria não encontrada para esta conta.',
      })
    }

    const result = await pool.query(
      `UPDATE produto
       SET nome = $1,
           descricao = $2,
           preco = $3,
           estoque = $4,
           id_categoria = $5
       WHERE id_produto = $6
       AND id_conta = $7
       RETURNING id_produto, id_conta, nome, descricao, preco, estoque, id_categoria`,
      [
        nome,
        descricao,
        preco,
        estoque,
        id_categoria,
        id,
        id_conta
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

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM produto
       WHERE id_produto = $1
       AND id_conta = $2
       RETURNING id_produto`,
      [id, id_conta]
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