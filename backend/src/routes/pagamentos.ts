import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

export const FORMAS_PAGAMENTO = [
  'Pix',
  'Dinheiro',
  'Cartão débito',
  'Cartão crédito',
  'Transferência',
  'Outro',
] as const

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const opcional = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined))

const pagamentoSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione o paciente'),
  orcamentoId: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  data: z.string().regex(DATA_REGEX, 'Data inválida').optional(),
  valor: z.number().positive('Valor deve ser maior que zero'),
  forma: z.enum(FORMAS_PAGAMENTO),
  referencia: opcional(),
})

const INCLUDE_PAGAMENTO = {
  paciente: { select: { id: true, nome: true, telefone: true } },
  orcamento: {
    select: {
      id: true,
      status: true,
      desconto: true,
      itens: { select: { descricao: true, quantidade: true, valorUnit: true } },
    },
  },
} as const

export async function rotasPagamentos(app: FastifyInstance) {
  app.get('/api/pagamentos', { preHandler: autenticar }, async (request) => {
    const { de, ate, pacienteId, orcamentoId, forma } = request.query as {
      de?: string
      ate?: string
      pacienteId?: string
      orcamentoId?: string
      forma?: string
    }

    const inicio = de ? new Date(`${de}T00:00:00.000Z`) : undefined
    const fim = ate ? new Date(`${ate}T23:59:59.999Z`) : undefined

    const pagamentos = await prisma.pagamento.findMany({
      where: {
        ...(inicio && fim ? { data: { gte: inicio, lte: fim } } : {}),
        ...(pacienteId ? { pacienteId } : {}),
        ...(orcamentoId ? { orcamentoId } : {}),
        ...(forma ? { forma } : {}),
      },
      include: INCLUDE_PAGAMENTO,
      orderBy: { data: 'desc' },
    })
    return { pagamentos }
  })

  app.get('/api/pagamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const pagamento = await prisma.pagamento.findUnique({ where: { id }, include: INCLUDE_PAGAMENTO })
    if (!pagamento) {
      return reply.status(404).send({ erro: 'Pagamento não encontrado' })
    }
    return { pagamento }
  })

  app.post('/api/pagamentos', { preHandler: autenticar }, async (request, reply) => {
    const resultado = pagamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const paciente = await prisma.paciente.findUnique({ where: { id: dados.pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    if (dados.orcamentoId) {
      const orcamento = await prisma.orcamento.findUnique({ where: { id: dados.orcamentoId } })
      if (!orcamento) {
        return reply.status(404).send({ erro: 'Orçamento não encontrado' })
      }
      if (orcamento.pacienteId !== dados.pacienteId) {
        return reply.status(400).send({ erro: 'O orçamento selecionado não pertence a esse paciente' })
      }
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        pacienteId: dados.pacienteId,
        orcamentoId: dados.orcamentoId,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        valor: dados.valor,
        forma: dados.forma,
        referencia: dados.referencia,
      },
      include: INCLUDE_PAGAMENTO,
    })
    return reply.status(201).send({ pagamento })
  })

  app.put('/api/pagamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = pagamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const existente = await prisma.pagamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Pagamento não encontrado' })
    }

    if (dados.orcamentoId) {
      const orcamento = await prisma.orcamento.findUnique({ where: { id: dados.orcamentoId } })
      if (!orcamento) {
        return reply.status(404).send({ erro: 'Orçamento não encontrado' })
      }
      if (orcamento.pacienteId !== dados.pacienteId) {
        return reply.status(400).send({ erro: 'O orçamento selecionado não pertence a esse paciente' })
      }
    }

    const pagamento = await prisma.pagamento.update({
      where: { id },
      data: {
        pacienteId: dados.pacienteId,
        orcamentoId: dados.orcamentoId ?? null,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        valor: dados.valor,
        forma: dados.forma,
        referencia: dados.referencia,
      },
      include: INCLUDE_PAGAMENTO,
    })
    return { pagamento }
  })

  app.delete('/api/pagamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.pagamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Pagamento não encontrado' })
    }

    await prisma.pagamento.delete({ where: { id } })
    return reply.status(204).send()
  })
}
