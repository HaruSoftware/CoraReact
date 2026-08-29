import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'

export interface AuthRequest extends Request {
  usuario?: {
    id_usuario: number
    id_conta: number
    nome: string
    email: string
  }
}
export async function autenticar(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization

  let token: string | undefined

  if (authorization) {
    const [tipo, tokenAuthorization] = authorization.split(' ')

    if (tipo === 'Bearer' && tokenAuthorization) {
      token = tokenAuthorization
    }
  }

  if (!token) {
    token = req.cookies.token
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token não informado.',
    })
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id_usuario: number
      id_conta: number
    }

    const result = await pool.query(
      `SELECT id_usuario, id_conta, nome, email
       FROM usuario
       WHERE id_usuario = $1
         AND id_conta = $2`,
      [payload.id_usuario, payload.id_conta]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado.',
      })
    }

    const usuario = result.rows[0]

    req.usuario = {
      id_usuario: usuario.id_usuario,
      id_conta: usuario.id_conta,
      nome: usuario.nome,
      email: usuario.email,
    }

    next()
  } catch (error) {
    console.error('Erro ao autenticar:', error)

    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.',
    })
  }
}
