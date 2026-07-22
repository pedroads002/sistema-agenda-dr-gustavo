import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

export const SEXOS = ['feminino', 'masculino', 'outro'] as const
export const ORIGENS = ['trafego_pago', 'organico', 'indicacao', 'retorno', 'outro'] as const

const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor ? valor : undefined))

const emailOpcional = textoOpcional.pipe(z.string().email('E-mail inválido').optional())

const telefoneOpcional = textoOpcional.pipe(
  z
    .string()
    .refine((valor) => /^\d{10,11}$/.test(valor.replace(/\D/g, '')), 'Telefone inválido (informe DDD + número)')
    .optional(),
)

const cpfOpcional = textoOpcional.pipe(
  z.string().refine((valor) => /^\d{11}$/.test(valor.replace(/\D/g, '')), 'CPF inválido').optional(),
)

const ufOpcional = textoOpcional
  .transform((valor) => valor?.toUpperCase())
  .pipe(z.string().length(2, 'UF deve ter 2 letras').optional())

const nascimentoOpcional = textoOpcional.pipe(
  z
    .string()
    .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Data de nascimento inválida')
    .transform((valor) => new Date(valor))
    .optional(),
)
const sexoOpcional = textoOpcional.pipe(z.enum(SEXOS).optional())
const origemOpcional = textoOpcional.pipe(z.enum(ORIGENS).optional())

const pacienteSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome completo'),
  cpf: cpfOpcional,
  telefone: telefoneOpcional,
  email: emailOpcional,
  nascimento: nascimentoOpcional,
  sexo: sexoOpcional,
  cidade: textoOpcional,
  uf: ufOpcional,
  endereco: textoOpcional,
  origem: origemOpcional,
  observacoes: textoOpcional,
})

export async function rotasPacientes(app: FastifyInstance) {
  app.get('/api/pacientes', { preHandler: autenticar }, async (request) => {
    const { busca } = request.query as { busca?: string }
    const termo = busca?.trim()

    const pacientes = await prisma.paciente.findMany({
      where: termo
        ? { OR: [{ nome: { contains: termo } }, { telefone: { contains: termo } }] }
        : undefined,
      orderBy: { nome: 'asc' },
    })

    return { pacientes }
  })

  app.get('/api/pacientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const paciente = await prisma.paciente.findUnique({ where: { id } })
    if (!paciente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }
    return { paciente }
  })

  app.post('/api/pacientes', { preHandler: autenticar }, async (request, reply) => {
    const resultado = pacienteSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const paciente = await prisma.paciente.create({ data: resultado.data })
    return reply.status(201).send({ paciente })
  })

  app.put('/api/pacientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const resultado = pacienteSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    const existente = await prisma.paciente.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    const paciente = await prisma.paciente.update({ where: { id }, data: resultado.data })
    return { paciente }
  })

  app.delete('/api/pacientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existente = await prisma.paciente.findUnique({ where: { id } })
    if (!existente) {
      return reply.status(404).send({ erro: 'Paciente não encontrado' })
    }

    await prisma.paciente.delete({ where: { id } })
    return reply.status(204).send()
  })
}
