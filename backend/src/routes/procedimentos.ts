import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const CATEGORIAS = ['intima_masculina', 'intima_feminina', 'corporal', 'facial', 'outros'] as const

const procedimentoSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do procedimento'),
  categoria: z.enum(CATEGORIAS),
  valorBase: z.number().min(0).optional().default(0),
  duracaoMin: z.number().int().min(1).optional().default(60),
  ordem: z.number().int().optional().default(0),
  ativo: z.boolean().optional(),
})

export async function rotasProcedimentos(app: FastifyInstance) {
  app.get('/api/procedimentos', { preHandler: autenticar }, async (request) => {
    const { todos } = request.query as { todos?: string }
    const procedimentos = await prisma.procedimento.findMany({
      where: todos === '1' ? undefined : { ativo: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    })
    return { procedimentos }
  })

  app.get('/api/procedimentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const procedimento = await prisma.procedimento.findUnique({ where: { id } })
    if (!procedimento) {
      return reply.status(404).send({ erro: 'Procedimento não encontrado' })
    }
    return { procedimento }
  })

  app.post('/api/procedimentos', { preHandler: autenticar }, async (request, reply) => {
    const resultado = procedimentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const procedimento = await prisma.procedimento.create({ data: resultado.data })
    return reply.status(201).send({ procedimento })
  })

  app.put('/api/procedimentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = procedimentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.procedimento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Procedimento não encontrado' })
    }

    const procedimento = await prisma.procedimento.update({ where: { id }, data: resultado.data })
    return { procedimento }
  })
}
