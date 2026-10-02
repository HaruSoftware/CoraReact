import { Router } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { googleOAuthConfigurado } from '../../config/password.js'

const router = Router()
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/api/auth',
}

function exigirConfiguracaoGoogle(
    _req: Parameters<Parameters<typeof router.get>[1]>[0],
    res: Parameters<Parameters<typeof router.get>[1]>[1],
    next: Parameters<Parameters<typeof router.get>[1]>[2]
) {
    if (!googleOAuthConfigurado) {
        return res.status(503).json({
            success: false,
            message: 'Login Google indisponível. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e BACKEND_URL.',
        })
    }

    next()
}

// INICIAR LOGIN COM GOOGLE

router.get('/google', exigirConfiguracaoGoogle, async (req, res, next) => {
    const idPlano = req.query.id_plano

    if (typeof idPlano === 'string') {
        const idPlanoNumber = Number(idPlano)

        if (!Number.isInteger(idPlanoNumber) || idPlanoNumber <= 0) {
            return res.status(400).json({
                success: false,
                message: 'O plano selecionado é inválido.',
            })
        }

        try {
            const result = await pool.query(
                'SELECT id_plano FROM plano WHERE id_plano = $1 AND ativo = TRUE',
                [idPlanoNumber]
            )

            if (result.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'O plano selecionado não está disponível.',
                })
            }

            res.cookie('google_plan_id', idPlanoNumber, {
                ...cookieOptions,
                maxAge: 10 * 60 * 1000,
            })
        } catch (error) {
            return next(error)
        }
    }

    return passport.authenticate('google', {
        scope: ['profile', 'email'],
    })(req, res, next)
})

// CALLBACK DO GOOGLE

router.get(
    '/google/callback',
    exigirConfiguracaoGoogle,
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login',
    }),
    async (req, res) => {
        const client = await pool.connect()
        const idPlano = Number(req.cookies?.google_plan_id)
        res.clearCookie('google_plan_id', cookieOptions)

        try {
            const profile = req.user as {
                id: string
                displayName: string
                emails?: {
                    value: string
                    verified?: boolean
                }[]
            }

            const googleId = profile.id
            const emailOriginal = profile.emails?.[0]?.value
            const email = emailOriginal?.trim().toLowerCase()
            const nome = profile.displayName

            if (!googleId || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Não foi possível obter os dados da conta Google.',
                })
            }

            // 1. Procura pelo Google ID
            const usuarioGoogle = await client.query(
                `SELECT id_usuario, id_conta, nome, email, google_id
                 FROM usuario
                 WHERE google_id = $1`,
                [googleId]
            )

            let usuario

            if (usuarioGoogle.rows.length > 0) {
                // Usuário Google já existe
                usuario = usuarioGoogle.rows[0]
            } else {
                // 2. Procura usuário existente pelo e-mail
                const usuarioEmail = await client.query(
                    `SELECT id_usuario, id_conta, nome, email, google_id
                     FROM usuario
                     WHERE LOWER(BTRIM(email)) = $1`,
                    [email]
                )

                if (usuarioEmail.rows.length > 0) {
                    // Usuário já existia e agora está vinculando o Google
                    const usuarioExistente = usuarioEmail.rows[0]

                    const result = await client.query(
                        `UPDATE usuario
                         SET google_id = $1,
                             senha = NULL
                         WHERE id_usuario = $2
                         RETURNING id_usuario, id_conta, nome, email, google_id`,
                        [googleId, usuarioExistente.id_usuario]
                    )

                    usuario = result.rows[0]
                } else {
                    if (!Number.isInteger(idPlano) || idPlano <= 0) {
                        return res.redirect(`${process.env.FRONTEND_URL}/register?erro=plano`)
                    }

                    const planoResult = await client.query(
                        `SELECT id_plano, preco_mensal
                         FROM plano
                         WHERE id_plano = $1 AND ativo = TRUE`,
                        [idPlano]
                    )

                    if (planoResult.rows.length === 0) {
                        return res.redirect(`${process.env.FRONTEND_URL}/register?erro=plano`)
                    }

                    // 3. Primeiro login Google: cria conta + usuário
                    await client.query('BEGIN')

                    const contaResult = await client.query(
                        `INSERT INTO conta (nome, email)
                         VALUES ($1, $2)
                         RETURNING id_conta`,
                        [nome, email]
                    )

                    const id_conta = contaResult.rows[0].id_conta

                    // Gera um valor aleatório apenas para satisfazer a estrutura
                    // caso futuramente seja necessário algum tratamento.
                    // Para usuários Google, a senha permanece NULL.
                    const senha = null

                    const usuarioResult = await client.query(
                        `INSERT INTO usuario (
                            id_conta,
                            nome,
                            email,
                            senha,
                            google_id
                         )
                         VALUES ($1, $2, $3, $4, $5)
                         RETURNING id_usuario, id_conta, nome, email, google_id`,
                        [
                            id_conta,
                            nome,
                            email,
                            senha,
                            googleId,
                        ]
                    )

                    usuario = usuarioResult.rows[0]

                    await client.query(
                        `INSERT INTO assinatura (
                            id_conta, id_plano, valor_mensal, data_inicio, data_fim_periodo
                         )
                         VALUES ($1, $2, $3, CURRENT_DATE,
                                 (CURRENT_DATE + INTERVAL '1 month')::date)`,
                        [id_conta, idPlano, planoResult.rows[0].preco_mensal]
                    )

                    await client.query('COMMIT')
                }
            }

            // 4. Gera o mesmo JWT utilizado pelo login tradicional
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

            return res.redirect(
                `${process.env.FRONTEND_URL}/`
            )
        } catch (error) {
            await client.query('ROLLBACK')

            console.error('Erro ao autenticar com Google:', error)

            return res.status(500).json({
                success: false,
                message: 'Erro ao realizar autenticação com Google.',
            })
        } finally {
            client.release()
        }
    }
)

export default router
