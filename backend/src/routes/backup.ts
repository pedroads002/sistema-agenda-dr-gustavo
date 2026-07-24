import type { FastifyInstance } from 'fastify'
import { ZipArchive } from 'archiver'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { autenticar } from '../auth/middleware.js'
import { UPLOADS_DIR } from '../lib/uploads.js'

// backend/src/routes/backup.ts -> backend/src -> backend
const DIR_BACKEND = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// Lê o caminho real do banco a partir de DATABASE_URL (a mesma variável que o Prisma usa),
// em vez de um caminho fixo — assim funciona tanto localmente (caminho relativo, resolvido
// a partir de backend/prisma/, igual o Prisma faz) quanto em produção (caminho absoluto
// dentro de um volume persistente, ex.: "file:/data/consultorio.db" no Railway).
function resolverCaminhoBanco(): string {
  const bruto = (process.env.DATABASE_URL ?? '').replace(/^file:/, '')
  return path.isAbsolute(bruto) ? bruto : path.join(DIR_BACKEND, 'prisma', bruto)
}

const DB_PATH = resolverCaminhoBanco()

export async function rotasBackup(app: FastifyInstance) {
  app.get('/api/backup/exportar', { preHandler: autenticar }, async (request, reply) => {
    if (!existsSync(DB_PATH)) {
      return reply.status(500).send({ erro: 'Banco de dados não encontrado' })
    }

    const dataHoje = new Date().toISOString().slice(0, 10)
    reply.header('Content-Type', 'application/zip')
    reply.header('Content-Disposition', `attachment; filename="backup-dr-gustavo-${dataHoje}.zip"`)

    const arquivoZip = new ZipArchive({ zlib: { level: 9 } })
    arquivoZip.on('error', (erro: Error) => app.log.error(erro))

    arquivoZip.file(DB_PATH, { name: 'consultorio.db' })
    if (existsSync(UPLOADS_DIR)) {
      arquivoZip.directory(UPLOADS_DIR, 'uploads')
    }
    arquivoZip.finalize()

    return reply.send(arquivoZip)
  })
}
