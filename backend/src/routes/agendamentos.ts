import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

export const STATUS_AGENDAMENTO = ['a_confirmar', 'confirmado', 'compareceu', 'desmarcou', 'faltou'] as const

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const agendamentoSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione o paciente'),
  localId: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  data: z.string().regex(DATA_REGEX, 'Data inválida'),
  horaInicio: z.string().regex(HORA_REGEX, 'Hora de início inválida'),
  horaFim: z.string().regex(HORA_REGEX, 'Hora de fim inválida'),
  procedimentoNome: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  status: z.enum(STATUS_AGENDAMENTO).default('a_confirmar'),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  forcarConflito: z.boolean().optional(),
})

/** Converte data (YYYY-MM-DD) + hora (HH:MM) informadas no fuso de Brasília para um instante UTC.
 * O Brasil não usa mais horário de verão, então o deslocamento -03:00 é fixo o ano todo. */
function paraInstanteBrasilia(data: string, hora: string): Date {
  return new Date(`${data}T${hora}:00-03:00`)
}

function limitesDoDiaBrasilia(data: string) {
  return { inicio: paraInstanteBrasilia(data, '00:00'), fim: paraInstanteBrasilia(data, '23:59') }
}

/** Bloqueio.data é um campo "só data" (sem hora), guardado como meia-noite UTC — igual ao
 * nascimento do paciente. Por isso a busca aqui usa limites em UTC, não no fuso de Brasília. */
function limitesDoDiaUTC(data: string) {
  return { inicio: new Date(`${data}T00:00:00.000Z`), fim: new Date(`${data}T23:59:59.999Z`) }
}

async function encontrarBloqueioConflitante(data: string, horaInicio: string, horaFim: string) {
  const { inicio, fim } = limitesDoDiaUTC(data)
  const bloqueiosDoDia = await prisma.bloqueio.findMany({ where: { data: { gte: inicio, lte: fim } } })

  return bloqueiosDoDia.find((bloqueio) => {
    if (bloqueio.diaInteiro) return true
    if (!bloqueio.horaInicio || !bloqueio.horaFim) return false
    return horaInicio < bloqueio.horaFim && horaFim > bloqueio.horaInicio
  })
}

async function encontrarAgendamentoConflitante(
  data: string,
  horaInicio: string,
  horaFim: string,
  excluirId?: string,
) {
  const { inicio, fim } = limitesDoDiaBrasilia(data)
  const agendamentosDoDia = await prisma.agendamento.findMany({
    where: { inicio: { gte: inicio, lte: fim }, ...(excluirId ? { id: { not: excluirId } } : {}) },
    include: { paciente: { select: { nome: true } } },
  })

  const novoInicio = paraInstanteBrasilia(data, horaInicio)
  const novoFim = paraInstanteBrasilia(data, horaFim)

  return agendamentosDoDia.find((agendamento) => {
    const existenteFim = agendamento.fim ?? new Date(agendamento.inicio.getTime() + 30 * 60 * 1000)
    return novoInicio < existenteFim && novoFim > agendamento.inicio
  })
}

export async function rotasAgendamentos(app: FastifyInstance) {
  app.get('/api/agendamentos', { preHandler: autenticar }, async (request) => {
    const { de, ate, localId } = request.query as { de?: string; ate?: string; localId?: string }

    const inicio = de ? paraInstanteBrasilia(de, '00:00') : undefined
    const fim = ate ? paraInstanteBrasilia(ate, '23:59') : undefined

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        ...(inicio && fim ? { inicio: { gte: inicio, lte: fim } } : {}),
        ...(localId ? { localId } : {}),
      },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true, origem: true } },
        local: { select: { id: true, nome: true, cidade: true, uf: true } },
      },
      orderBy: { inicio: 'asc' },
    })

    return { agendamentos }
  })

  app.get('/api/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true, origem: true } },
        local: { select: { id: true, nome: true, cidade: true, uf: true } },
      },
    })
    if (!agendamento) {
      return reply.status(404).send({ erro: 'Agendamento não encontrado' })
    }
    return { agendamento }
  })

  app.post('/api/agendamentos', { preHandler: autenticar }, async (request, reply) => {
    const resultado = agendamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    if (dados.horaFim <= dados.horaInicio) {
      return reply.status(400).send({ erro: 'A hora de fim deve ser depois da hora de início' })
    }

    const bloqueio = await encontrarBloqueioConflitante(dados.data, dados.horaInicio, dados.horaFim)
    if (bloqueio) {
      return reply.status(409).send({
        erro: bloqueio.diaInteiro
          ? 'Esse dia está bloqueado (indisponível).'
          : `Esse horário está bloqueado (${bloqueio.horaInicio}–${bloqueio.horaFim})${bloqueio.motivo ? `: ${bloqueio.motivo}` : ''}.`,
        tipo: 'bloqueio',
      })
    }

    if (!dados.forcarConflito) {
      const conflito = await encontrarAgendamentoConflitante(dados.data, dados.horaInicio, dados.horaFim)
      if (conflito) {
        return reply.status(409).send({
          erro: `Já existe um agendamento nesse horário com ${conflito.paciente.nome}. Confirme se deseja sobrepor.`,
          tipo: 'conflito',
        })
      }
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        pacienteId: dados.pacienteId,
        localId: dados.localId,
        inicio: paraInstanteBrasilia(dados.data, dados.horaInicio),
        fim: paraInstanteBrasilia(dados.data, dados.horaFim),
        procedimentoNome: dados.procedimentoNome,
        descricao: dados.descricao,
        status: dados.status,
        observacoes: dados.observacoes,
      },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true, origem: true } },
        local: { select: { id: true, nome: true, cidade: true, uf: true } },
      },
    })
    return reply.status(201).send({ agendamento })
  })

  app.put('/api/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = agendamentoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const existente = await prisma.agendamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Agendamento não encontrado' })
    }

    if (dados.horaFim <= dados.horaInicio) {
      return reply.status(400).send({ erro: 'A hora de fim deve ser depois da hora de início' })
    }

    const bloqueio = await encontrarBloqueioConflitante(dados.data, dados.horaInicio, dados.horaFim)
    if (bloqueio) {
      return reply.status(409).send({
        erro: bloqueio.diaInteiro
          ? 'Esse dia está bloqueado (indisponível).'
          : `Esse horário está bloqueado (${bloqueio.horaInicio}–${bloqueio.horaFim})${bloqueio.motivo ? `: ${bloqueio.motivo}` : ''}.`,
        tipo: 'bloqueio',
      })
    }

    if (!dados.forcarConflito) {
      const conflito = await encontrarAgendamentoConflitante(dados.data, dados.horaInicio, dados.horaFim, id)
      if (conflito) {
        return reply.status(409).send({
          erro: `Já existe um agendamento nesse horário com ${conflito.paciente.nome}. Confirme se deseja sobrepor.`,
          tipo: 'conflito',
        })
      }
    }

    const agendamento = await prisma.agendamento.update({
      where: { id },
      data: {
        pacienteId: dados.pacienteId,
        localId: dados.localId ?? null,
        inicio: paraInstanteBrasilia(dados.data, dados.horaInicio),
        fim: paraInstanteBrasilia(dados.data, dados.horaFim),
        procedimentoNome: dados.procedimentoNome,
        descricao: dados.descricao,
        status: dados.status,
        observacoes: dados.observacoes,
      },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true, origem: true } },
        local: { select: { id: true, nome: true, cidade: true, uf: true } },
      },
    })
    return { agendamento }
  })

  app.delete('/api/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.agendamento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Agendamento não encontrado' })
    }

    await prisma.agendamento.delete({ where: { id } })
    return reply.status(204).send()
  })
}
