import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
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
import { rotasConfiguracoes } from './routes/configuracoes.js'
import { rotasPainel } from './routes/painel.js'
import { rotasBackup } from './routes/backup.js'

// trustProxy: quando o acesso vem por trás de um proxy (ex.: Cloudflare Tunnel), confia no
// cabeçalho X-Forwarded-Proto para saber se a conexão original do navegador era HTTPS —
// usado para decidir o cookie de sessão (ver rotasAuth, cookie "secure").
const app = Fastify({ logger: true, trustProxy: true })

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
await app.register(rotasConfiguracoes)
await app.register(rotasPainel)
await app.register(rotasBackup)

// Rota simples para confirmar que o servidor está de pé.
app.get('/api/saude', async () => {
  return { status: 'ok' }
})

// Serve o build de produção do frontend (frontend/dist), na mesma porta da API.
// Em desenvolvimento essa pasta não existe (o Vite roda separado), então o servidor
// segue funcionando normalmente só com a API.
const DIR_ATUAL = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_DIST = path.join(DIR_ATUAL, '..', '..', 'frontend', 'dist')

if (existsSync(FRONTEND_DIST)) {
  await app.register(staticPlugin, {
    root: FRONTEND_DIST,
    wildcard: false,
  })

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply.status(404).send({ erro: 'Rota não encontrada' })
    }
    // Qualquer outra rota é uma tela do React (React Router cuida da navegação no navegador).
    return reply.sendFile('index.html', FRONTEND_DIST)
  })
}

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
