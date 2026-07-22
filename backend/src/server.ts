import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { env } from './lib/env.js'
import { rotasAuth } from './routes/auth.js'

const app = Fastify({ logger: true })

await app.register(cookie)
await app.register(rotasAuth)

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
