import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

/** Leitura do catálogo de procedimentos (o cadastro/edição do catálogo é de uma fase futura). */
export async function rotasProcedimentos(app: FastifyInstance) {
  app.get('/api/procedimentos', { preHandler: autenticar }, async () => {
    const procedimentos = await prisma.procedimento.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    })
    return { procedimentos }
  })
}
