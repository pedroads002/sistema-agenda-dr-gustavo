import Fastify from 'fastify'

const app = Fastify({ logger: true })

// Rota simples para confirmar que o servidor está de pé.
// As rotas de verdade (pacientes, agenda, etc.) entram nas próximas fases.
app.get('/api/saude', async () => {
  return { status: 'ok' }
})

const PORTA = Number(process.env.PORTA) || 3333

app
  .listen({ port: PORTA, host: '0.0.0.0' })
  .catch((erro) => {
    app.log.error(erro)
    process.exit(1)
  })
