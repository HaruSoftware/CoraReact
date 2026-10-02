import { Router } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { autenticar, type AuthRequest } from '../middleware/auth.js'
import { googleOAuthConfigurado } from '../../config/password.js'

const router = Router()
const cookieVinculoGoogle = 'google_user_link'
const opcoesCookieVinculoGoogle = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth/google/callback',
    maxAge: 10 * 60 * 1000,
}

function urlConfiguracoes(status: string) {
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '')
    return `${frontendUrl}/settings?google_user=${encodeURIComponent(status)}`
}

function conflitoVinculoGoogle(error: unknown) {
    return error instanceof Error && error.name === 'ConflitoVinculoGoogle'
        || typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

async function adicionarOuVincularUsuarioGoogle(
    idConta: number,
    googleId: string,
    email: string,
    nome: string
): Promise<'added' | 'linked' | 'exists'> {
    const client = await pool.connect()
    let transacaoIniciada = false

    try {
        await client.query('BEGIN')
        transacaoIniciada = true

        const encontrados = await client.query(
            `SELECT id_usuario, id_conta, email, google_id
             FROM usuario
             WHERE google_id = $1 OR LOWER(BTRIM(email)) = $2
             FOR UPDATE`,
            [googleId, email]
        )

        if (encontrados.rows.length > 1) {
            const error = new Error('A conta Google e o e-mail correspondem a usuários diferentes.')
            error.name = 'ConflitoVinculoGoogle'
            throw error
        }

        if (encontrados.rows.length === 1) {
            const usuarioExistente = encontrados.rows[0]

            if (usuarioExistente.id_conta !== idConta) {
                const error = new Error('A conta Google ou o e-mail já pertence a outra conta.')
                error.name = 'ConflitoVinculoGoogle'
                throw error
            }

            if (usuarioExistente.google_id === googleId) {
                await client.query('COMMIT')
                transacaoIniciada = false
                return 'exists'
            }

            if (usuarioExistente.google_id) {
                const error = new Error('Este usuário já está vinculado a outra conta Google.')
                error.name = 'ConflitoVinculoGoogle'
                throw error
            }

            await client.query(
                `UPDATE usuario
                 SET google_id = $1
                 WHERE id_usuario = $2 AND id_conta = $3`,
                [googleId, usuarioExistente.id_usuario, idConta]
            )
            await client.query('COMMIT')
            transacaoIniciada = false
            return 'linked'
        }

        await client.query(
            `INSERT INTO usuario (id_conta, nome, email, senha, google_id)
             VALUES ($1, $2, $3, NULL, $4)`,
            [idConta, nome, email, googleId]
        )

        await client.query('COMMIT')
        transacaoIniciada = false
        return 'added'
    } catch (error) {
        if (transacaoIniciada) await client.query('ROLLBACK').catch(() => undefined)
        throw error
    } finally {
        client.release()
    }
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

router.get(
    '/google',
    exigirConfiguracaoGoogle,
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
)

router.get(
    '/google/link',
    exigirConfiguracaoGoogle,
    autenticar,
    (req, res, next) => {
        const usuario = (req as AuthRequest).usuario!
        const estado = jwt.sign(
            {
                acao: 'adicionar_usuario_google',
                id_usuario: usuario.id_usuario,
                id_conta: usuario.id_conta,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '10m' }
        )

        res.cookie(cookieVinculoGoogle, estado, opcoesCookieVinculoGoogle)
        return passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: estado,
        })(req, res, next)
    }
)

// CALLBACK DO GOOGLE

router.get(
    '/google/callback',
    exigirConfiguracaoGoogle,
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login',
    }),
    async (req, res) => {
        const estadoVinculo = req.cookies?.[cookieVinculoGoogle]

        if (estadoVinculo) {
            res.clearCookie(cookieVinculoGoogle, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: opcoesCookieVinculoGoogle.path,
            })

            try {
                const estado = jwt.verify(estadoVinculo, process.env.JWT_SECRET!) as {
                    acao: string
                    id_usuario: number
                    id_conta: number
                }
                const tokenSessao = req.cookies?.token
                const estadoRetornado = req.query.state

                if (
                    !tokenSessao ||
                    typeof estadoRetornado !== 'string' ||
                    estadoRetornado !== estadoVinculo ||
                    estado.acao !== 'adicionar_usuario_google'
                ) {
                    return res.redirect(urlConfiguracoes('error'))
                }

                const sessao = jwt.verify(tokenSessao, process.env.JWT_SECRET!) as {
                    id_usuario: number
                    id_conta: number
                }

                if (sessao.id_usuario !== estado.id_usuario || sessao.id_conta !== estado.id_conta) {
                    return res.redirect(urlConfiguracoes('error'))
                }

                const profile = req.user as {
                    id: string
                    displayName: string
                    emails?: { value: string; verified?: boolean }[]
                }
                const email = profile.emails?.[0]?.value.trim().toLowerCase()

                if (!profile.id || !email) {
                    return res.redirect(urlConfiguracoes('error'))
                }

                const status = await adicionarOuVincularUsuarioGoogle(
                    estado.id_conta,
                    profile.id,
                    email,
                    profile.displayName || email
                )

                return res.redirect(urlConfiguracoes(status))
            } catch (error) {
                console.error('Erro ao adicionar conta Google à equipe:', error)
                return res.redirect(urlConfiguracoes(conflitoVinculoGoogle(error) ? 'conflict' : 'error'))
            }
        }

        const client = await pool.connect()

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
                    // 3. Primeiro login Google: cria conta e usuário; o plano é escolhido depois.
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
                path: '/',
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
