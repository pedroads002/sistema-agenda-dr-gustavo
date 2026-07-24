import type { FastifyInstance } from 'fastify'
import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'
import { salvarArquivo, removerArquivo, streamArquivo, MIME_IMAGENS } from '../lib/uploads.js'

export const TIPOS_FOTO = ['antes', 'depois'] as const
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

function valorCampo(valor: unknown): string | undefined {
  if (valor && typeof valor === 'object' && 'value' in valor) {
    const bruto = (valor as MultipartValue).value
    return bruto === undefined || bruto === null ? undefined : String(bruto)
  }
  return undefined
}

function arquivoCampo(valor: unknown): MultipartFile | undefined {
  if (valor && typeof valor === 'object' && (valor as { type?: string }).type === 'file') {
    return valor as MultipartFile
  }
  return undefined
}

const camposSchema = z.object({
  pacienteId: z.string().min(1, 'Selecione o paciente'),
  procedimentoRealizadoId: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  tipo: z.enum(TIPOS_FOTO),
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  data: z.string().regex(DATA_REGEX, 'Data inválida').optional(),
})

const INCLUDE_PROCEDIMENTO = {
  procedimentoRealizado: { select: { id: true, procedimento: true, data: true } },
} as const

type CorpoMultipart = Record<string, unknown>

function omitirCaminho<T extends { caminho: string; mimeType: string }>(foto: T): Omit<T, 'caminho' | 'mimeType'> {
  const { caminho, mimeType, ...resto } = foto
  return resto
}

export async function rotasFotos(app: FastifyInstance) {
  app.get('/api/fotos', { preHandler: autenticar }, async (request) => {
    const { pacienteId } = request.query as { pacienteId?: string }
    const fotos = await prisma.foto.findMany({
      where: pacienteId ? { pacienteId } : {},
      include: INCLUDE_PROCEDIMENTO,
      orderBy: { data: 'desc' },
    })
    return { fotos: fotos.map(omitirCaminho) }
  })

  app.post('/api/fotos', { preHandler: autenticar }, async (request, reply) => {
    const corpo = request.body as CorpoMultipart
    const resultado = camposSchema.safeParse({
      pacienteId: valorCampo(corpo.pacienteId),
      procedimentoRealizadoId: valorCampo(corpo.procedimentoRealizadoId),
      tipo: valorCampo(corpo.tipo),
      descricao: valorCampo(corpo.descricao),
      data: valorCampo(corpo.data),
    })
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const paciente = await prisma.paciente.findUnique({ where: { id: dados.pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    if (dados.procedimentoRealizadoId) {
      const procedimento = await prisma.procedimentoRealizado.findUnique({
        where: { id: dados.procedimentoRealizadoId },
      })
      if (!procedimento || procedimento.pacienteId !== dados.pacienteId) {
        return reply.status(400).send({ erro: 'Procedimento realizado inválido para esse paciente' })
      }
    }

    const arquivo = arquivoCampo(corpo.arquivo)
    if (!arquivo || !arquivo.filename) {
      return reply.status(400).send({ erro: 'Selecione a foto para enviar' })
    }
    if (!MIME_IMAGENS.includes(arquivo.mimetype)) {
      return reply.status(400).send({ erro: 'A foto deve ser um arquivo JPG, PNG ou WEBP' })
    }
    const buffer = await arquivo.toBuffer()
    const caminho = await salvarArquivo(buffer, arquivo.mimetype)

    const foto = await prisma.foto.create({
      data: {
        pacienteId: dados.pacienteId,
        procedimentoRealizadoId: dados.procedimentoRealizadoId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        caminho,
        mimeType: arquivo.mimetype,
      },
      include: INCLUDE_PROCEDIMENTO,
    })
    return reply.status(201).send({ foto: omitirCaminho(foto) })
  })

  app.delete('/api/fotos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.foto.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Foto não encontrada' })
    }
    await removerArquivo(existente.caminho)
    await prisma.foto.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Rota autenticada para servir a foto — nunca uma pasta pública/estática.
  app.get('/api/fotos/:id/arquivo', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const foto = await prisma.foto.findUnique({ where: { id } })
    if (!foto) {
      return reply.status(404).send({ erro: 'Foto não encontrada' })
    }
    reply.header('Content-Type', foto.mimeType)
    reply.header('Content-Disposition', 'inline')
    return reply.send(streamArquivo(foto.caminho))
  })
}
