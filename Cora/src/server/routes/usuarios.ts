import { Router } from 'express'
import { pool } from '../db.js'
import bcrypt from 'bcrypt'
import { autenticar, type AuthRequest } from '../middleware/auth.js'

const router = Router()
const restricaoEmailUnico = 'uq_usuario_email_normalizado'

function conflitoDeEmail(error: unknown) {
    return typeof error === 'object' && error !== null &&
        'constraint' in error && error.constraint === restricaoEmailUnico
}

router.get('/', autenticar, async (req, res) => {
    try {
        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        const result = await pool.query(
                    `SELECT id_usuario, id_conta, nome, email,
                        (google_id IS NOT NULL) AS conta_google,
                        (senha IS NOT NULL) AS conta_senha
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
        const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : ''

        const request = req as AuthRequest
        const id_conta = request.usuario!.id_conta

        if (!nome || !emailNormalizado || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios.',
            })
        }

        const usuarioExistente = await pool.query(
            `SELECT id_usuario
             FROM usuario
             WHERE LOWER(BTRIM(email)) = $1
             LIMIT 1`,
            [emailNormalizado]
        )

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Este e-mail já está associado a uma conta.',
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
            RETURNING id_usuario, id_conta, nome, email,
                      (google_id IS NOT NULL) AS conta_google,
                      (senha IS NOT NULL) AS conta_senha`,
            [id_conta, nome, emailNormalizado, senhaHash]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        if (conflitoDeEmail(error)) {
            return res.status(409).json({
                success: false,
                message: 'Este e-mail já está associado a uma conta.',
            })
        }

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

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: 'Nome é obrigatório.',
            })
        }

        const usuarioAtual = await pool.query(
            `SELECT email
             FROM usuario
             WHERE id_usuario = $1
               AND id_conta = $2`,
            [id, id_conta]
        )

        if (usuarioAtual.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado.',
            })
        }

        if (
            email !== undefined &&
            (typeof email !== 'string' || email.trim().toLowerCase() !== usuarioAtual.rows[0].email.trim().toLowerCase())
        ) {
            return res.status(400).json({
                success: false,
                message: 'O e-mail não pode ser alterado. Exclua o usuário e cadastre-o novamente para usar outro endereço.',
            })
        }

        let result

        if (senha) {
            const senhaHash = await bcrypt.hash(senha, 10)

            result = await pool.query(
                `UPDATE usuario
                 SET nome = $1,
                     senha = $2
                 WHERE id_usuario = $3
                 AND id_conta = $4
                 RETURNING id_usuario, id_conta, nome, email`,
                [nome, senhaHash, id, id_conta]
            )
        } else {
            result = await pool.query(
                `UPDATE usuario
                 SET nome = $1
                 WHERE id_usuario = $2
                 AND id_conta = $3
                 RETURNING id_usuario, id_conta, nome, email`,
                [nome, id, id_conta]
            )
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado.',
            })
        }

        res.json(result.rows[0])
    } catch (error) {
        if (conflitoDeEmail(error)) {
            return res.status(409).json({
                success: false,
                message: 'Este e-mail já está associado a uma conta.',
            })
        }

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