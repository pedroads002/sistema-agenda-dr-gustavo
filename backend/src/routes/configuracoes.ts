import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const ID_SINGLETON = 'singleton'

// Transforma para `null` (não `undefined`) porque o formulário sempre envia o objeto
// inteiro: se o usuário apagar um campo, o PUT precisa limpar o valor salvo, não ignorá-lo.
const textoOpcional = z
  .string()
  .optional()
  .transform((valor) => valor?.trim() || null)

const emailOpcional = textoOpcional.refine(
  (valor) => valor === null || z.string().email().safeParse(valor).success,
  { message: 'E-mail inválido' },
)

const ufOpcional = z
  .string()
  .optional()
  .transform((valor) => (valor?.trim() ? valor.trim().toUpperCase() : null))
  .refine((valor) => valor === null || valor.length === 2, { message: 'UF deve ter 2 letras' })

const configuracaoSchema = z.object({
  nomeConsultorio: z.string().trim().min(1, 'Informe o nome do consultório'),
  nomeProfissional: z.string().trim().min(1, 'Informe o nome do profissional'),
  registroProfissional: textoOpcional,
  telefone: textoOpcional,
  email: emailOpcional,
  endereco: textoOpcional,
  cidade: textoOpcional,
  uf: ufOpcional,
})

const PADRAO = {
  id: ID_SINGLETON,
  nomeConsultorio: 'Dr. Gustavo Amaral',
  nomeProfissional: 'Dr. Gustavo Amaral',
}

async function obterOuCriar() {
  const existente = await prisma.configuracao.findUnique({ where: { id: ID_SINGLETON } })
  if (existente) return existente
  return prisma.configuracao.create({ data: PADRAO })
}

export async function rotasConfiguracoes(app: FastifyInstance) {
  app.get('/api/configuracoes', { preHandler: autenticar }, async () => {
    const configuracao = await obterOuCriar()
    return { configuracao }
  })

  app.put('/api/configuracoes', { preHandler: autenticar }, async (request, reply) => {
    const resultado = configuracaoSchema.safeParse(request.body)
    if (!resultado.success) {
      return reply.status(400).send({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos' })
    }

    await obterOuCriar()
    const configuracao = await prisma.configuracao.update({
      where: { id: ID_SINGLETON },
      data: resultado.data,
    })
    return { configuracao }
  })
}
