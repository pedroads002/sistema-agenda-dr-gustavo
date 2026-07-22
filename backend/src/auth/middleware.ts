import type { FastifyReply, FastifyRequest } from 'fastify'
import { verificarToken, type PayloadSessao } from './jwt.js'

export const NOME_COOKIE = 'sessao'

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: PayloadSessao
  }
}

export async function autenticar(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[NOME_COOKIE]
  if (!token) {
    return reply.status(401).send({ erro: 'Não autenticado' })
  }

  try {
    request.usuario = verificarToken(token)
  } catch {
    return reply.status(401).send({ erro: 'Sessão inválida ou expirada' })
  }
}
