import { Router } from 'express'
import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', autenticar, async (req, res) => {
    try {
        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        const result = await pool.query(
            `SELECT id_usuario, id_conta, nome, email
             FROM usuario
             WHERE id_conta = $1
             ORDER BY id_usuario`,
            [id_conta]
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

router.post('/', autenticar, async (req, res) => {
    try {
        const { nome, email, senha } = req.body

        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios.',
            })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const result = await pool.query(
            `INSERT INTO usuario (
                id_conta,
                nome,
                email,
                senha
            )
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

router.put('/:id', autenticar, async (req, res) => {
    try {
        const { id } = req.params
        const { nome, email, senha } = req.body

        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        if (!nome || !email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios.',
            })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const result = await pool.query(
            `UPDATE usuario
             SET nome = $1,
                 email = $2,
                 senha = $3
             WHERE id_usuario = $4
             AND id_conta = $5
             RETURNING id_usuario, id_conta, nome, email`,
            [nome, email, senhaHash, id, id_conta]
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

router.delete('/:id', autenticar, async (req, res) => {
    try {
        const { id } = req.params

        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        const result = await pool.query(
            `DELETE FROM usuario
             WHERE id_usuario = $1
             AND id_conta = $2
             RETURNING id_usuario`,
            [id, id_conta]
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