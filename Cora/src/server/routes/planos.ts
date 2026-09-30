import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id_plano, codigo, nome, descricao, preco_mensal, demonstrativo
             FROM plano
             WHERE ativo = TRUE
             ORDER BY preco_mensal, id_plano`
        )

        res.json(result.rows)
    } catch (error) {
        console.error('Erro ao listar planos:', error)
        res.status(500).json({
            success: false,
            message: 'Não foi possível carregar os planos.',
        })
    }
})

export default router