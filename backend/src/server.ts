import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { env } from './lib/env.js'
import { TAMANHO_MAXIMO_BYTES } from './lib/uploads.js'
import { rotasAuth } from './routes/auth.js'
import { rotasPacientes } from './routes/pacientes.js'
import { rotasLocais } from './routes/locais.js'
import { rotasBloqueios } from './routes/bloqueios.js'
import { rotasAgendamentos } from './routes/agendamentos.js'
import { rotasProcedimentos } from './routes/procedimentos.js'
import { rotasProntuario } from './routes/prontuario.js'
import { rotasOrcamentos } from './routes/orcamentos.js'
import { rotasPagamentos } from './routes/pagamentos.js'
import { rotasAnamnese } from './routes/anamnese.js'
import { rotasConsentimentos } from './routes/consentimentos.js'
import { rotasFotos } from './routes/fotos.js'

const app = Fastify({ logger: true })

await app.register(cookie)
await app.register(multipart, {
  attachFieldsToBody: true,
  limits: { fileSize: TAMANHO_MAXIMO_BYTES, files: 1 },
})
await app.register(rotasAuth)
await app.register(rotasPacientes)
await app.register(rotasLocais)
await app.register(rotasBloqueios)
await app.register(rotasAgendamentos)
await app.register(rotasProcedimentos)
await app.register(rotasProntuario)
await app.register(rotasOrcamentos)
await app.register(rotasPagamentos)
await app.register(rotasAnamnese)
await app.register(rotasConsentimentos)
await app.register(rotasFotos)

// Rota simples para confirmar que o servidor está de pé.
app.get('/api/saude', async () => {
  return { status: 'ok' }
})

app.setErrorHandler((erro: FastifyError, request, reply) => {
  if (erro.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.status(400).send({ erro: 'Arquivo muito grande. Tamanho máximo: 10 MB.' })
  }
  if (erro.code?.startsWith('FST_')) {
    return reply.status(400).send({ erro: 'Não foi possível enviar o arquivo. Tente novamente.' })
  }
  app.log.error(erro)
  reply.status(erro.statusCode ?? 500).send({ erro: 'Erro interno do servidor' })
})

app
  .listen({ port: env.porta, host: '0.0.0.0' })
  .catch((erro) => {
    app.log.error(erro)
    process.exit(1)
  })
