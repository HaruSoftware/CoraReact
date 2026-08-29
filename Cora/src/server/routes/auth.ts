import { Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/logout', (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    })

    res.json({
        success: true,
        message: 'Logout realizado com sucesso.',
    })
})

// LOGIN

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

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        )

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

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000,
        })

        res.json({
            success: true,
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

// CADASTRO

router.post('/register', async (req, res) => {
    const client = await pool.connect()

    try {
        const {
            nomeEmpresa,
            emailEmpresa,
            nome,
            email,
            senha,
        } = req.body

        if (
            !nomeEmpresa ||
            !emailEmpresa ||
            !nome ||
            !email ||
            !senha
        ) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios.',
            })
        }

        // Verifica se o e-mail do usuário já existe
        const usuarioExistente = await client.query(
            `SELECT id_usuario
             FROM usuario
             WHERE email = $1`,
            [email]
        )

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Este e-mail de usuário já está cadastrado.',
            })
        }

        // Inicia a transação
        await client.query('BEGIN')

        // Cria a conta
        const contaResult = await client.query(
            `INSERT INTO conta (nome, email)
             VALUES ($1, $2)
             RETURNING id_conta`,
            [nomeEmpresa, emailEmpresa]
        )

        const id_conta = contaResult.rows[0].id_conta

        // Criptografa a senha
        const senhaHash = await bcrypt.hash(senha, 10)

        // Cria o usuário
        const usuarioResult = await client.query(
            `INSERT INTO usuario (
                id_conta,
                nome,
                email,
                senha
             )
             VALUES ($1, $2, $3, $4)
             RETURNING id_usuario, id_conta, nome, email`,
            [
                id_conta,
                nome,
                email,
                senhaHash,
            ]
        )

        const usuario = usuarioResult.rows[0]

        // Confirma a transação
        await client.query('COMMIT')

        // Gera o token
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

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000,
        })

        res.status(201).json({
            success: true,
            message: 'Conta criada com sucesso.',
            usuario,
        })
    } catch (error) {
        // Desfaz a transação se algo der errado
        await client.query('ROLLBACK')

        console.error('Erro ao realizar cadastro:', error)

        res.status(500).json({
            success: false,
            message: 'Erro ao realizar cadastro.',
        })
    } finally {
        client.release()
    }
})

export default router