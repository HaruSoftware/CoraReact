import { Router } from 'express'
import { pool } from '../db.js'
import bcrypt from 'bcrypt'

const router = Router()

router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id_usuario, id_conta, nome, email
       FROM usuario
       ORDER BY id_usuario`
        )

        res.json(result.rows)
    } catch (error) {
        console.error('Erro ao buscar usuários:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários.',
        })
    }
})

router.post('/', async (req, res) => {
    try {
        const { id_conta, nome, email, senha } = req.body

        if (!id_conta || !nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Conta, nome, email e senha são obrigatórios.',
            })
        }
        const senhaHash = await bcrypt.hash(senha, 10)

        const result = await pool.query(
            `INSERT INTO usuario (id_conta, nome, email, senha)
            VALUES ($1, $2, $3, $4)
            RETURNING id_usuario, id_conta, nome, email`,
            [id_conta, nome, email, senhaHash]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Erro ao criar usuário:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao criar usuário.',
        })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { id_conta, nome, email, senha } = req.body

        if (!id_conta || !nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Conta, nome, email e senha são obrigatórios.',
            })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const result = await pool.query(
            `UPDATE usuario
            SET id_conta = $1,
           nome = $2,
           email = $3,
           senha = $4
       WHERE id_usuario = $5
       RETURNING id_usuario, id_conta, nome, email`,
            [id_conta, nome, email, senhaHash, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado.',
            })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar usuário.',
        })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        
        const result = await pool.query(
            `DELETE FROM usuario
       WHERE id_usuario = $1
       RETURNING id_usuario`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado.',
            })
        }

        res.json({
            success: true,
            message: 'Usuário excluído com sucesso.',
        })
    } catch (error) {
        console.error('Erro ao excluir usuário:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao excluir usuário.',
        })
    }
})

export default router