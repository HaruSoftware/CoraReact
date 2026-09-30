import { Router } from 'express'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/me', autenticar, async (req, res) => {
    const { id_conta } = (req as AuthRequest).usuario!

    try {
        const result = await pool.query(
            `SELECT assinatura.id_assinatura, assinatura.status,
                    assinatura.periodicidade, assinatura.valor_mensal,
                    assinatura.data_inicio, assinatura.data_fim_periodo,
                    plano.id_plano, plano.codigo, plano.nome, plano.demonstrativo
             FROM assinatura
             JOIN plano ON plano.id_plano = assinatura.id_plano
             WHERE assinatura.id_conta = $1
               AND assinatura.status = 'ativa'
             ORDER BY assinatura.data_criacao DESC
             LIMIT 1`,
            [id_conta]
        )

        res.json({ assinatura: result.rows[0] ?? null })
    } catch (error) {
        console.error('Erro ao consultar assinatura:', error)
        res.status(500).json({
            success: false,
            message: 'Não foi possível carregar a assinatura.',
        })
    }
})

router.post('/', autenticar, async (req, res) => {
    const { id_conta } = (req as AuthRequest).usuario!
    const idPlano = Number(req.body.id_plano)

    if (!Number.isInteger(idPlano) || idPlano <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Selecione um plano válido.',
        })
    }

    const client = await pool.connect()
    let transacaoIniciada = false

    try {
        await client.query('BEGIN')
        transacaoIniciada = true

        await client.query(
            'SELECT id_conta FROM conta WHERE id_conta = $1 FOR UPDATE',
            [id_conta]
        )

        const assinaturaAtual = await client.query(
            `SELECT id_assinatura
             FROM assinatura
             WHERE id_conta = $1 AND status = 'ativa'
             LIMIT 1`,
            [id_conta]
        )

        if (assinaturaAtual.rows.length > 0) {
            await client.query('ROLLBACK')
            transacaoIniciada = false
            return res.status(409).json({
                success: false,
                message: 'Esta conta já possui um plano ativo.',
            })
        }

        const plano = await client.query(
            `SELECT id_plano, preco_mensal
             FROM plano
             WHERE id_plano = $1 AND ativo = TRUE`,
            [idPlano]
        )

        if (plano.rows.length === 0) {
            await client.query('ROLLBACK')
            transacaoIniciada = false
            return res.status(400).json({
                success: false,
                message: 'O plano selecionado não está disponível.',
            })
        }

        const result = await client.query(
            `INSERT INTO assinatura (
                id_conta, id_plano, valor_mensal, data_inicio, data_fim_periodo
             )
             VALUES ($1, $2, $3, CURRENT_DATE,
                     (CURRENT_DATE + INTERVAL '1 month')::date)
             RETURNING id_assinatura, id_plano, status, periodicidade,
                       valor_mensal, data_inicio, data_fim_periodo`,
            [id_conta, idPlano, plano.rows[0].preco_mensal]
        )

        await client.query('COMMIT')
        transacaoIniciada = false
        return res.status(201).json({ assinatura: result.rows[0] })
    } catch (error) {
        if (transacaoIniciada) await client.query('ROLLBACK').catch(() => undefined)
        console.error('Erro ao ativar assinatura:', error)
        return res.status(500).json({
            success: false,
            message: 'Não foi possível ativar o plano.',
        })
    } finally {
        client.release()
    }
})

export default router