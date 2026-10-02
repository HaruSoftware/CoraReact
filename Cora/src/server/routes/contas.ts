import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Buscar a conta do usuário autenticado
router.get('/me', autenticar, async (req, res) => {
  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta

    const result = await pool.query(
      `SELECT id_conta, nome, email, data_criacao, id_usuario_criador
       FROM conta
       WHERE id_conta = $1`,
      [id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    res.json({
      success: true,
      conta: result.rows[0],
    })
  } catch (error) {
    console.error('Erro ao buscar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conta.',
    })
  }
})

router.delete('/me/dados/:area', autenticar, async (req, res) => {
  const client = await pool.connect()

  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta
    const id_usuario = request.usuario!.id_usuario
    const { area } = req.params
    const confirmacao = typeof req.body?.confirmacao === 'string'
      ? req.body.confirmacao.toUpperCase()
      : ''

    if (confirmacao !== 'EXCLUIR') {
      return res.status(400).json({
        success: false,
        message: 'Digite EXCLUIR exatamente para confirmar.',
      })
    }

    if (typeof area !== 'string' || !['clientes', 'vendas', 'produtos', 'categorias'].includes(area)) {
      return res.status(400).json({
        success: false,
        message: 'Área inválida para limpeza.',
      })
    }

    await client.query('BEGIN')
    const conta = await client.query(
      `SELECT id_usuario_criador
       FROM conta
       WHERE id_conta = $1
       FOR UPDATE`,
      [id_conta]
    )

    if (conta.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    if (conta.rows[0].id_usuario_criador !== id_usuario) {
      await client.query('ROLLBACK')
      return res.status(403).json({
        success: false,
        message: 'Somente o criador da conta pode executar ações na zona de perigo.',
      })
    }

    const dependencias: Record<string, { consulta: string; mensagem: string }> = {
      clientes: {
        consulta: `SELECT 1
                   FROM venda
                   JOIN cliente ON cliente.id_cliente = venda.id_cliente
                   WHERE venda.id_conta = $1
                   LIMIT 1`,
        mensagem: 'Limpe as vendas antes de limpar os clientes vinculados.',
      },
      produtos: {
        consulta: `SELECT 1
                   FROM item_venda
                   JOIN venda ON venda.id_venda = item_venda.id_venda
                   JOIN produto ON produto.id_produto = item_venda.id_produto
                   WHERE venda.id_conta = $1
                     AND produto.id_conta = $1
                   LIMIT 1`,
        mensagem: 'Limpe as vendas antes de limpar os produtos vinculados.',
      },
      categorias: {
        consulta: `SELECT 1
                   FROM produto
                   WHERE id_conta = $1
                   LIMIT 1`,
        mensagem: 'Limpe os produtos antes de limpar as categorias.',
      },
    }
    const dependencia = dependencias[area]

    if (dependencia) {
      const resultadoDependencia = await client.query(dependencia.consulta, [id_conta])

      if (resultadoDependencia.rows.length > 0) {
        await client.query('ROLLBACK')
        return res.status(409).json({
          success: false,
          message: dependencia.mensagem,
        })
      }
    }

    const consultas: Record<string, string> = {
      clientes: 'DELETE FROM cliente WHERE id_conta = $1',
      vendas: 'DELETE FROM venda WHERE id_conta = $1',
      produtos: 'DELETE FROM produto WHERE id_conta = $1',
      categorias: 'DELETE FROM categoria WHERE id_conta = $1',
    }
    const resultado = await client.query(consultas[area], [id_conta])
    await client.query('COMMIT')

    res.json({
      success: true,
      removidos: resultado.rowCount ?? 0,
      message: 'Dados removidos com sucesso.',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Erro ao limpar dados da conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao limpar dados da área selecionada.',
    })
  } finally {
    client.release()
  }
})


// Criar conta
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
       RETURNING id_conta, nome, email, data_criacao`,
      [nome, email]
    )

    res.status(201).json({
      success: true,
      conta: result.rows[0],
    })
  } catch (error) {
    console.error('Erro ao criar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta.',
    })
  }
})


// Atualizar a conta do usuário autenticado
router.put('/me', autenticar, async (req, res) => {
  try {
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
       RETURNING id_conta, nome, email, data_criacao`,
      [nome, email, id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    res.json({
      success: true,
      conta: result.rows[0],
    })
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar conta.',
    })
  }
})


// Excluir a conta do usuário autenticado
router.delete('/me', autenticar, async (req, res) => {
  const client = await pool.connect()

  try {
    const request = req as AuthRequest
    const id_conta = request.usuario!.id_conta
    const id_usuario = request.usuario!.id_usuario
    const confirmacao = typeof req.body?.confirmacao === 'string'
      ? req.body.confirmacao.toUpperCase()
      : ''

    if (confirmacao !== 'EXCLUIR') {
      return res.status(400).json({
        success: false,
        message: 'Digite EXCLUIR exatamente para confirmar.',
      })
    }

    await client.query('BEGIN')
    const conta = await client.query(
      `SELECT id_usuario_criador
       FROM conta
       WHERE id_conta = $1
       FOR UPDATE`,
      [id_conta]
    )

    if (conta.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada.',
      })
    }

    if (conta.rows[0].id_usuario_criador !== id_usuario) {
      await client.query('ROLLBACK')
      return res.status(403).json({
        success: false,
        message: 'Somente o criador da conta pode executar ações na zona de perigo.',
      })
    }

    await client.query('DELETE FROM conta WHERE id_conta = $1', [id_conta])
    await client.query('COMMIT')

    res.json({
      success: true,
      message: 'Conta excluída com sucesso.',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Erro ao excluir conta:', error)

    res.status(500).json({
      success: false,
      message: 'Erro ao excluir conta.',
    })
  } finally {
    client.release()
  }
})

export default router
