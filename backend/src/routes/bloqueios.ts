import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const bloqueioSchemaBase = z.object({
  data: z
    .string()
    .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Data inválida')
    .transform((valor) => new Date(`${valor.slice(0, 10)}T00:00:00.000Z`)),
  diaInteiro: z.boolean().default(true),
  horaInicio: z
    .string()
    .regex(HORA_REGEX, 'Hora de início inválida')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  horaFim: z
    .string()
    .regex(HORA_REGEX, 'Hora de fim inválida')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  motivo: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
})

const bloqueioSchema = bloqueioSchemaBase.superRefine((dados, ctx) => {
  if (!dados.diaInteiro) {
    if (!dados.horaInicio || !dados.horaFim) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe hora de início e fim quando não for o dia inteiro',
        path: ['horaInicio'],
      })
      return
    }
    if (dados.horaFim <= dados.horaInicio) {
      ctx.addIssue({ code: 'custom', message: 'A hora de fim deve ser depois da hora de início', path: ['horaFim'] })
    }
  }
})

export async function rotasBloqueios(app: FastifyInstance) {
  app.get('/api/bloqueios', { preHandler: autenticar }, async (request) => {
    const { de, ate } = request.query as { de?: string; ate?: string }
    const bloqueios = await prisma.bloqueio.findMany({
      where:
        de && ate
          ? { data: { gte: new Date(`${de}T00:00:00.000Z`), lte: new Date(`${ate}T23:59:59.999Z`) } }
          : undefined,
      orderBy: { data: 'asc' },
    })
    return { bloqueios }
  })

  app.post('/api/bloqueios', { preHandler: autenticar }, async (request, reply) => {
    const resultado = bloqueioSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const dados = resultado.data
    const bloqueio = await prisma.bloqueio.create({
      data: {
        data: dados.data,
        diaInteiro: dados.diaInteiro,
        horaInicio: dados.diaInteiro ? undefined : dados.horaInicio,
        horaFim: dados.diaInteiro ? undefined : dados.horaFim,
        motivo: dados.motivo,
      },
    })
    return reply.status(201).send({ bloqueio })
  })

  app.delete('/api/bloqueios/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.bloqueio.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Bloqueio não encontrado' })
    }

    await prisma.bloqueio.delete({ where: { id } })
    return reply.status(204).send()
  })
}
