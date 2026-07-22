import jwt from 'jsonwebtoken'
import { env } from '../lib/env.js'

const EXPIRACAO = '7d'

export type PayloadSessao = {
  sub: string
  email: string
}

export function assinarToken(payload: PayloadSessao): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRACAO })
}

export function verificarToken(token: string): PayloadSessao {
  return jwt.verify(token, env.jwtSecret) as PayloadSessao
}
