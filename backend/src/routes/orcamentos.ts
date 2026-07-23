import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

export const STATUS_ORCAMENTO = ['pendente', 'aprovado', 'recusado'] as const

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

const opcional = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined))

const itemOrcamentoSchema = z.object({
  descricao: z.string().trim().min(1, 'Informe a descrição do item'),
  quantidade: z.number().int().min(1, 'Quantidade mínima é 1').optional().default(1),
  valorUnit: z.number().min(0, 'Valor não pode ser negativo').optional().default(0),
})

const orcamentoSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione o paciente'),
  data: z.string().regex(DATA_REGEX, 'Data inválida').optional(),
  validoAte: z
    .string()
    .regex(DATA_REGEX, 'Data de validade inválida')
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  status: z.enum(STATUS_ORCAMENTO).default('pendente'),
  desconto: z.number().min(0, 'Desconto não pode ser negativo').optional().default(0),
  observacoes: opcional(),
  itens: z.array(itemOrcamentoSchema).min(1, 'Adicione ao menos um item ao orçamento'),
})

const INCLUDE_ORCAMENTO = {
  paciente: {
    select: { id: true, nome: true, telefone: true, cpf: true, endereco: true, cidade: true, uf: true },
  },
  itens: true,
  pagamentos: { select: { id: true, valor: true, data: true, forma: true } },
} as const

export async function rotasOrcamentos(app: FastifyInstance) {
  app.get('/api/orcamentos', { preHandler: autenticar }, async (request) => {
    const { status, pacienteId } = request.query as { status?: string; pacienteId?: string }
    const orcamentos = await prisma.orcamento.findMany({
      where: {
        ...(status && status !== 'todos' ? { status } : {}),
        ...(pacienteId ? { pacienteId } : {}),
      },
      include: INCLUDE_ORCAMENTO,
      orderBy: { data: 'desc' },
    })
    return { orcamentos }
  })

  app.get('/api/orcamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const orcamento = await prisma.orcamento.findUnique({ where: { id }, include: INCLUDE_ORCAMENTO })
    if (!orcamento) {
      return reply.status(404).send({ erro: 'Orçamento não encontrado' })
    }
    return { orcamento }
  })

  app.post('/api/orcamentos', { preHandler: autenticar }, async (request, reply) => {
    const resultado = orcamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const dados = resultado.data
    const paciente = await prisma.paciente.findUnique({ where: { id: dados.pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    const orcamento = await prisma.orcamento.create({
      data: {
        pacienteId: dados.pacienteId,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        validoAte: dados.validoAte ? new Date(`${dados.validoAte}T00:00:00.000Z`) : undefined,
        status: dados.status,
        desconto: dados.desconto,
        observacoes: dados.observacoes,
        itens: {
          create: dados.itens.map((item) => ({
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
          })),
        },
      },
      include: INCLUDE_ORCAMENTO,
    })
    return reply.status(201).send({ orcamento })
  })

  app.put('/api/orcamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = orcamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.orcamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Orçamento não encontrado' })
    }

    const dados = resultado.data
    const orcamento = await prisma.$transaction(async (tx) => {
      await tx.orcamentoItem.deleteMany({ where: { orcamentoId: id } })
      return tx.orcamento.update({
        where: { id },
        data: {
          pacienteId: dados.pacienteId,
          data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
          validoAte: dados.validoAte ? new Date(`${dados.validoAte}T00:00:00.000Z`) : null,
          status: dados.status,
          desconto: dados.desconto,
          observacoes: dados.observacoes,
          itens: {
            create: dados.itens.map((item) => ({
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
            })),
          },
        },
        include: INCLUDE_ORCAMENTO,
      })
    })
    return { orcamento }
  })

  app.delete('/api/orcamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.orcamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Orçamento não encontrado' })
    }

    await prisma.orcamento.delete({ where: { id } })
    return reply.status(204).send()
  })
}
