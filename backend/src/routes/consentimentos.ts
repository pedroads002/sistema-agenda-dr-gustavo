import type { FastifyInstance } from 'fastify'
import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'
import { salvarArquivo, removerArquivo, streamArquivo, MIME_DOCUMENTOS } from '../lib/uploads.js'

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
  procedimento: z.string().trim().min(1, 'Informe o procedimento'),
  data: z.string().regex(DATA_REGEX, 'Data inválida').optional(),
  assinado: z.enum(['true', 'false']).optional().default('false'),
})

type CorpoMultipart = Record<string, unknown>

function omitirArquivo<T extends { arquivoPath: string | null; mimeType: string | null }>(
  consentimento: T,
): Omit<T, 'arquivoPath' | 'mimeType'> & { temArquivo: boolean } {
  const { arquivoPath, mimeType, ...resto } = consentimento
  return { ...resto, temArquivo: Boolean(arquivoPath) }
}

export async function rotasConsentimentos(app: FastifyInstance) {
  app.get('/api/consentimentos', { preHandler: autenticar }, async (request) => {
    const { pacienteId } = request.query as { pacienteId?: string }
    const consentimentos = await prisma.consentimento.findMany({
      where: pacienteId ? { pacienteId } : {},
      orderBy: { data: 'desc' },
    })
    return { consentimentos: consentimentos.map(omitirArquivo) }
  })

  app.get('/api/consentimentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const consentimento = await prisma.consentimento.findUnique({ where: { id } })
    if (!consentimento) {
      return reply.status(404).send({ erro: 'Consentimento não encontrado' })
    }
    return { consentimento: omitirArquivo(consentimento) }
  })

  app.post('/api/consentimentos', { preHandler: autenticar }, async (request, reply) => {
    const corpo = request.body as CorpoMultipart
    const resultado = camposSchema.safeParse({
      pacienteId: valorCampo(corpo.pacienteId),
      procedimento: valorCampo(corpo.procedimento),
      data: valorCampo(corpo.data),
      assinado: valorCampo(corpo.assinado),
    })
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const paciente = await prisma.paciente.findUnique({ where: { id: dados.pacienteId } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    const arquivo = arquivoCampo(corpo.arquivo)
    let arquivoPath: string | undefined
    let mimeType: string | undefined
    if (arquivo && arquivo.filename) {
      if (!MIME_DOCUMENTOS.includes(arquivo.mimetype)) {
        return reply.status(400).send({ erro: 'O anexo deve ser uma imagem (JPG/PNG/WEBP) ou um PDF' })
      }
      const buffer = await arquivo.toBuffer()
      arquivoPath = await salvarArquivo(buffer, arquivo.mimetype)
      mimeType = arquivo.mimetype
    }

    const consentimento = await prisma.consentimento.create({
      data: {
        pacienteId: dados.pacienteId,
        procedimento: dados.procedimento,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        assinado: dados.assinado === 'true',
        arquivoPath,
        mimeType,
      },
    })
    return reply.status(201).send({ consentimento: omitirArquivo(consentimento) })
  })

  app.put('/api/consentimentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.consentimento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Consentimento não encontrado' })
    }

    const corpo = request.body as CorpoMultipart
    const resultado = camposSchema.safeParse({
      pacienteId: valorCampo(corpo.pacienteId),
      procedimento: valorCampo(corpo.procedimento),
      data: valorCampo(corpo.data),
      assinado: valorCampo(corpo.assinado),
    })
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }
    const dados = resultado.data

    const arquivo = arquivoCampo(corpo.arquivo)
    let arquivoPath = existente.arquivoPath
    let mimeType = existente.mimeType
    if (arquivo && arquivo.filename) {
      if (!MIME_DOCUMENTOS.includes(arquivo.mimetype)) {
        return reply.status(400).send({ erro: 'O anexo deve ser uma imagem (JPG/PNG/WEBP) ou um PDF' })
      }
      const buffer = await arquivo.toBuffer()
      const novoCaminho = await salvarArquivo(buffer, arquivo.mimetype)
      if (existente.arquivoPath) await removerArquivo(existente.arquivoPath)
      arquivoPath = novoCaminho
      mimeType = arquivo.mimetype
    }

    const consentimento = await prisma.consentimento.update({
      where: { id },
      data: {
        procedimento: dados.procedimento,
        data: dados.data ? new Date(`${dados.data}T00:00:00.000Z`) : undefined,
        assinado: dados.assinado === 'true',
        arquivoPath,
        mimeType,
      },
    })
    return { consentimento: omitirArquivo(consentimento) }
  })

  app.delete('/api/consentimentos/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.consentimento.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Consentimento não encontrado' })
    }
    if (existente.arquivoPath) await removerArquivo(existente.arquivoPath)
    await prisma.consentimento.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Rota autenticada para servir o anexo — nunca uma pasta pública/estática.
  app.get('/api/consentimentos/:id/arquivo', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const consentimento = await prisma.consentimento.findUnique({ where: { id } })
    if (!consentimento || !consentimento.arquivoPath) {
      return reply.status(404).send({ erro: 'Arquivo não encontrado' })
    }
    reply.header('Content-Type', consentimento.mimeType ?? 'application/octet-stream')
    reply.header('Content-Disposition', 'inline')
    return reply.send(streamArquivo(consentimento.arquivoPath))
  })
}
