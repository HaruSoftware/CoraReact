import { Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios.',
            })
        }

        const result = await pool.query(
            `SELECT id_usuario, id_conta, nome, email, senha
       FROM usuario
       WHERE email = $1`,
            [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos.',
            })
        }

        const usuario = result.rows[0]

        const senhaValida = await bcrypt.compare(senha, usuario.senha)

        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos.',
            })
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                id_conta: usuario.id_conta,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '8h',
            }
        )

        res.json({
            success: true,
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                id_conta: usuario.id_conta,
                nome: usuario.nome,
                email: usuario.email,
            },
        })
    } catch (error) {
        console.error('Erro ao realizar login:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao realizar login.',
        })
    }
})

export default router