import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const localSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do local'),
  cidade: z.string().trim().min(1, 'Informe a cidade'),
  uf: z
    .string()
    .trim()
    .transform((valor) => valor.toUpperCase())
    .pipe(z.string().length(2, 'UF deve ter 2 letras')),
  endereco: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  ativo: z.boolean().optional(),
})

export async function rotasLocais(app: FastifyInstance) {
  app.get('/api/locais', { preHandler: autenticar }, async (request) => {
    const { todos } = request.query as { todos?: string }
    const locais = await prisma.local.findMany({
      where: todos === '1' ? undefined : { ativo: true },
      orderBy: { nome: 'asc' },
    })
    return { locais }
  })

  app.get('/api/locais/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const local = await prisma.local.findUnique({ where: { id } })
    if (!local) {
      return reply.status(404).send({ erro: 'Local não encontrado' })
    }
    return { local }
  })

  app.post('/api/locais', { preHandler: autenticar }, async (request, reply) => {
    const resultado = localSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const local = await prisma.local.create({ data: resultado.data })
    return reply.status(201).send({ local })
  })

  app.put('/api/locais/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = localSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.local.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Local não encontrado' })
    }

    const local = await prisma.local.update({ where: { id }, data: resultado.data })
    return { local }
  })
}
