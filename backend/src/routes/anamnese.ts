import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const perguntaSchema = z.object({
  chave: z.string().trim().min(1),
  pergunta: z.string().trim().min(1),
  resposta: z.boolean(),
  detalhe: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
})

const anamneseSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione o paciente'),
  data: z.string().regex(DATA_REGEX, 'Data inválida').optional(),
  perguntas: z.array(perguntaSchema).min(1, 'Inclua ao menos uma pergunta'),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
})

type DadosAnamnese = z.infer<typeof anamneseSchema>

function serializarRespostas(dados: DadosAnamnese): string {
  return JSON.stringify({ perguntas: dados.perguntas, observacoes: dados.observacoes ?? null })
}

function formatar(anamnese: { id: string; pacienteId: string; data: Date; respostas: string; criadoEm: Date }) {
  const { respostas, ...resto } = anamnese
  return { ...resto, ...JSON.parse(respostas) }
}

export async function rotasAnamnese(app: FastifyInstance) {
  app.get('/api/anamneses', { preHandler: autenticar }, async (request) => {
    const { pacienteId } = request.query as { pacienteId?: string }
    const anamneses = await prisma.anamnese.findMany({
      where: pacienteId ? { pacienteId } : {},
      orderBy: { data: 'desc' },
    })
    return { anamneses: anamneses.map(formatar) }
  })

  app.get('/api/anamneses/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const anamnese = await prisma.anamnese.findUnique({ where: { id } })
    if (!anamnese) {
      return reply.status(404).send({ erro: 'Anamnese não encontrada' })
    }
    return { anamnese: formatar(anamnese) }
  })

  app.post('/api/anamneses', { preHandler: autenticar }, async (request, reply) => {
    const resultado = anamneseSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const paciente = await prisma.paciente.findUnique({ where: { id: dados.pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    const anamnese = await prisma.anamnese.create({
      data: {
        pacienteId: dados.pacienteId,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        respostas: serializarRespostas(dados),
      },
    })
    return reply.status(201).send({ anamnese: formatar(anamnese) })
  })

  app.put('/api/anamneses/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = anamneseSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.anamnese.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Anamnese não encontrada' })
    }

    const dados = resultado.data
    const anamnese = await prisma.anamnese.update({
      where: { id },
      data: {
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        respostas: serializarRespostas(dados),
      },
    })
    return { anamnese: formatar(anamnese) }
  })

  app.delete('/api/anamneses/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.anamnese.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Anamnese não encontrada' })
    }
    await prisma.anamnese.delete({ where: { id } })
    return reply.status(204).send()
  })
}
