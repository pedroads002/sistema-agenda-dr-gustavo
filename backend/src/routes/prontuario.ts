import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const opcional = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined))

const produtoAplicadoSchema = z.object({
  produto: opcional(),
  lote: opcional(),
  validade: z
    .string()
    .regex(DATA_REGEX, 'Data de validade inválida')
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  quantidade: opcional(),
  regiao: opcional(),
})

const procedimentoRealizadoSchema = z.object({
  pacienteId: z.string().min(1),
  agendamentoId: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  data: z.string().regex(DATA_REGEX, 'Data inválida'),
  procedimento: z.string().trim().min(1, 'Selecione o procedimento'),
  observacoes: opcional(),
  produtos: z.array(produtoAplicadoSchema).optional().default([]),
})

const INCLUDE_PRODUTOS = { produtos: true } as const

export async function rotasProntuario(app: FastifyInstance) {
  app.get('/api/pacientes/:pacienteId/prontuario', { preHandler: autenticar }, async (request) => {
    const { pacienteId } = request.params as { pacienteId: string }
    const registros = await prisma.procedimentoRealizado.findMany({
      where: { pacienteId },
      include: INCLUDE_PRODUTOS,
      orderBy: { data: 'desc' },
    })
    return { registros }
  })

  app.post('/api/pacientes/:pacienteId/prontuario', { preHandler: autenticar }, async (request, reply) => {
    const { pacienteId } = request.params as { pacienteId: string }
    const resultado = procedimentoRealizadoSchema.safeParse({ ...(request.body as object), pacienteId })
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    const dados = resultado.data
    const registro = await prisma.procedimentoRealizado.create({
      data: {
        pacienteId,
        agendamentoId: dados.agendamentoId,
        data: new Date(`${dados.data}T00:00:00.000Z`),
        procedimento: dados.procedimento,
        observacoes: dados.observacoes,
        produtos: {
          create: dados.produtos.map((produto) => ({
            produto: produto.produto,
            lote: produto.lote,
            validade: produto.validade ? new Date(`${produto.validade}T00:00:00.000Z`) : undefined,
            quantidade: produto.quantidade,
            regiao: produto.regiao,
          })),
        },
      },
      include: INCLUDE_PRODUTOS,
    })
    return reply.status(201).send({ registro })
  })

  app.put('/api/pacientes/:pacienteId/prontuario/:id', { preHandler: autenticar }, async (request, reply) => {
    const { pacienteId, id } = request.params as { pacienteId: string; id: string }
    const resultado = procedimentoRealizadoSchema.safeParse({ ...(request.body as object), pacienteId })
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.procedimentoRealizado.findUnique({ where: { id } })
    if (!existente || existente.pacienteId !== pacienteId) {
      return reply.status(404).send({ erro: 'Registro não encontrado' })
    }

    const dados = resultado.data
    const registro = await prisma.$transaction(async (tx) => {
      await tx.produtoAplicado.deleteMany({ where: { procedimentoRealizadoId: id } })
      return tx.procedimentoRealizado.update({
        where: { id },
        data: {
          agendamentoId: dados.agendamentoId ?? null,
          data: new Date(`${dados.data}T00:00:00.000Z`),
          procedimento: dados.procedimento,
          observacoes: dados.observacoes,
          produtos: {
            create: dados.produtos.map((produto) => ({
              produto: produto.produto,
              lote: produto.lote,
              validade: produto.validade ? new Date(`${produto.validade}T00:00:00.000Z`) : undefined,
              quantidade: produto.quantidade,
              regiao: produto.regiao,
            })),
          },
        },
        include: INCLUDE_PRODUTOS,
      })
    })
    return { registro }
  })

  app.delete('/api/pacientes/:pacienteId/prontuario/:id', { preHandler: autenticar }, async (request, reply) => {
    const { pacienteId, id } = request.params as { pacienteId: string; id: string }
    const existente = await prisma.procedimentoRealizado.findUnique({ where: { id } })
    if (!existente || existente.pacienteId !== pacienteId) {
      return reply.status(404).send({ erro: 'Registro não encontrado' })
    }

    await prisma.procedimentoRealizado.delete({ where: { id } })
    return reply.status(204).send()
  })
}
