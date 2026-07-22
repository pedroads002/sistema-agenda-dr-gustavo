import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { env } from './lib/env.js'
import { rotasAuth } from './routes/auth.js'
import { rotasPacientes } from './routes/pacientes.js'
import { rotasLocais } from './routes/locais.js'
import { rotasBloqueios } from './routes/bloqueios.js'
import { rotasAgendamentos } from './routes/agendamentos.js'
import { rotasProcedimentos } from './routes/procedimentos.js'

const app = Fastify({ logger: true })

await app.register(cookie)
await app.register(rotasAuth)
await app.register(rotasPacientes)
await app.register(rotasLocais)
await app.register(rotasBloqueios)
await app.register(rotasAgendamentos)
await app.register(rotasProcedimentos)

// Rota simples para confirmar que o servidor está de pé.
app.get('/api/saude', async () => {
  return { status: 'ok' }
})

app
  .listen({ port: env.porta, host: '0.0.0.0' })
  .catch((erro) => {
    app.log.error(erro)
    process.exit(1)
  })
