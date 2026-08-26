import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
    usuario?: {
        id_usuario: number
        id_conta: number
    }
}

export function autenticar(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authorization = req.headers.authorization

    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: 'Token não informado.',
        })
    }

    const [tipo, token] = authorization.split(' ')

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido.',
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

        req.usuario = {
            id_usuario: payload.id_usuario,
            id_conta: payload.id_conta,
        }

        next()
    } catch {
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado.',
        })
    }
}