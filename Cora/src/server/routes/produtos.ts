import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
            `SELECT id_produto, id_conta, id_categoria, nome, descricao,
              codigo_barras, codigo_interno, preco, estoque, estoque_minimo,
              unidade_medida, ativo, data_cadastro, data_atualizacao
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
      codigo_barras,
      codigo_interno,
      preco,
      estoque,
      estoque_minimo,
      unidade_medida,
      ativo,
      id_categoria,
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      estoque_minimo === undefined ||
      !unidade_medida ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço, estoque, estoque mínimo, unidade e categoria são obrigatórios.',
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

    const unidade = await pool.query(
      `SELECT id_unidade_medida
       FROM unidade_medida
       WHERE id_conta = $1 AND codigo = $2 AND ativo = TRUE`,
      [id_conta, String(unidade_medida).trim().toUpperCase()]
    )

    if (unidade.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Unidade de medida não encontrada ou está bloqueada.',
      })
    }

    const result = await pool.query(
      `INSERT INTO produto (
        id_conta,
        id_categoria,
        nome,
        descricao,
        codigo_barras,
        codigo_interno,
        preco,
        estoque,
        estoque_minimo,
        String(unidade_medida).trim().toUpperCase(),
        ativo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_produto, id_conta, id_categoria, nome, descricao,
                codigo_barras, codigo_interno, preco, estoque, estoque_minimo,
                unidade_medida, ativo, data_cadastro, data_atualizacao`,
      [
        id_conta,
        id_categoria,
        nome,
        descricao,
        codigo_barras || null,
        codigo_interno || null,
        preco,
        estoque,
        estoque_minimo,
        unidade_medida,
        ativo === undefined ? true : ativo
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
      codigo_barras,
      codigo_interno,
      preco,
      estoque,
      estoque_minimo,
      unidade_medida,
      ativo,
      id_categoria,
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !nome ||
      preco === undefined ||
      estoque === undefined ||
      estoque_minimo === undefined ||
      !unidade_medida ||
      !id_categoria
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço, estoque, estoque mínimo, unidade e categoria são obrigatórios.',
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

    const unidade = await pool.query(
      `SELECT id_unidade_medida
       FROM unidade_medida
       WHERE id_conta = $1 AND codigo = $2 AND ativo = TRUE`,
      [id_conta, String(unidade_medida).trim().toUpperCase()]
    )

    if (unidade.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Unidade de medida não encontrada ou está bloqueada.',
      })
    }

    const result = await pool.query(
      `UPDATE produto
       SET id_categoria = $1,
           nome = $2,
           descricao = $3,
           codigo_barras = $4,
           codigo_interno = $5,
           preco = $6,
           estoque = $7,
           estoque_minimo = $8,
           unidade_medida = $9,
           ativo = $10,
           data_atualizacao = CURRENT_TIMESTAMP
       WHERE id_produto = $11
       AND id_conta = $12
       RETURNING id_produto, id_conta, id_categoria, nome, descricao,
                 codigo_barras, codigo_interno, preco, estoque, estoque_minimo,
                 unidade_medida, ativo, data_cadastro, data_atualizacao`,
      [
        id_categoria,
        nome,
        descricao,
        codigo_barras || null,
        codigo_interno || null,
        preco,
        estoque,
        estoque_minimo,
        String(unidade_medida).trim().toUpperCase(),
        ativo === undefined ? true : ativo,
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