import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT id_venda, id_conta, id_cliente, id_usuario, data, valor_total
       FROM venda
       WHERE id_conta = $1
       ORDER BY id_venda`,
      [id_conta]
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

router.post('/', autenticar, async (req, res) => {
  try {
    const {
      id_cliente,
      id_usuario,
      valor_total
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !id_cliente ||
      !id_usuario ||
      valor_total === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Cliente, usuário e valor total são obrigatórios.',
      })
    }

    const cliente = await pool.query(
      `SELECT id_cliente
       FROM cliente
       WHERE id_cliente = $1
       AND id_conta = $2`,
      [id_cliente, id_conta]
    )

    if (cliente.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado para esta conta.',
      })
    }

    const usuario = await pool.query(
      `SELECT id_usuario
       FROM usuario
       WHERE id_usuario = $1
       AND id_conta = $2`,
      [id_usuario, id_conta]
    )

    if (usuario.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado para esta conta.',
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

router.put('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const {
      id_cliente,
      id_usuario,
      valor_total
    } = req.body

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    if (
      !id_cliente ||
      !id_usuario ||
      valor_total === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Cliente, usuário e valor total são obrigatórios.',
      })
    }

    const cliente = await pool.query(
      `SELECT id_cliente
       FROM cliente
       WHERE id_cliente = $1
       AND id_conta = $2`,
      [id_cliente, id_conta]
    )

    if (cliente.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado para esta conta.',
      })
    }

    const usuario = await pool.query(
      `SELECT id_usuario
       FROM usuario
       WHERE id_usuario = $1
       AND id_conta = $2`,
      [id_usuario, id_conta]
    )

    if (usuario.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado para esta conta.',
      })
    }

    const result = await pool.query(
      `UPDATE venda
       SET id_cliente = $1,
           id_usuario = $2,
           valor_total = $3
       WHERE id_venda = $4
       AND id_conta = $5
       RETURNING id_venda, id_conta, id_cliente, id_usuario, data, valor_total`,
      [
        id_cliente,
        id_usuario,
        valor_total,
        id,
        id_conta
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada.',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar venda.',
    })
  }
})

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params

    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `DELETE FROM venda
       WHERE id_venda = $1
       AND id_conta = $2
       RETURNING id_venda`,
      [id, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada.',
      })
    }

    res.json({
      success: true,
      message: 'Venda excluída com sucesso.',
    })
  } catch (error) {
    console.error('Erro ao excluir venda:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir venda.',
    })
  }
})

export default router