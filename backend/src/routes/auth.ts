import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { conferirSenha, gerarHash } from '../auth/senha.js'
import { assinarToken } from '../auth/jwt.js'
import { autenticar, NOME_COOKIE } from '../auth/middleware.js'

const SETE_DIAS_EM_SEGUNDOS = 60 * 60 * 24 * 7

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8, 'A nova senha precisa ter pelo menos 8 caracteres'),
})

function paraSaida(usuario: { id: string; nome: string; email: string }) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email }
}

export async function rotasAuth(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const resultado = loginSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: 'E-mail ou senha inválidos' })
    }
    const { email, senha } = resultado.data

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario || !usuario.ativo) {
      return reply.status(401).send({ erro: 'E-mail ou senha incorretos' })
    }

    const senhaConfere = await conferirSenha(senha, usuario.senhaHash)
    if (!senhaConfere) {
      return reply.status(401).send({ erro: 'E-mail ou senha incorretos' })
    }

    const token = assinarToken({ sub: usuario.id, email: usuario.email })
    reply.setCookie(NOME_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      // Um cookie "secure" exige HTTPS para ser salvo/enviado. Localmente (sem HTTPS) isso
      // quebraria o login pelo IP da máquina; se o acesso externo (ex.: Cloudflare Tunnel)
      // sempre passar por HTTPS até o navegador, pode ligar via COOKIE_SECURE (ver
      // backend/.env.example).
      secure: env.cookieSecure,
      path: '/',
      maxAge: SETE_DIAS_EM_SEGUNDOS,
    })

    return { usuario: paraSaida(usuario) }
  })

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(NOME_COOKIE, { path: '/' })
    return { ok: true }
  })

  app.get('/api/auth/me', { preHandler: autenticar }, async (request, reply) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: request.usuario!.sub } })
    if (!usuario || !usuario.ativo) {
      reply.clearCookie(NOME_COOKIE, { path: '/' })
      return reply.status(401).send({ erro: 'Não autenticado' })
    }
    return { usuario: paraSaida(usuario) }
  })

  app.post('/api/auth/trocar-senha', { preHandler: autenticar }, async (request, reply) => {
    const resultado = trocarSenhaSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const { senhaAtual, novaSenha } = resultado.data

    const usuario = await prisma.usuario.findUnique({ where: { id: request.usuario!.sub } })
    if (!usuario) {
      return reply.status(401).send({ erro: 'Não autenticado' })
    }

    const senhaConfere = await conferirSenha(senhaAtual, usuario.senhaHash)
    if (!senhaConfere) {
      return reply.status(400).send({ erro: 'Senha atual incorreta' })
    }

    const novoHash = await gerarHash(novaSenha)
    await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: novoHash } })

    return { ok: true }
  })
}
