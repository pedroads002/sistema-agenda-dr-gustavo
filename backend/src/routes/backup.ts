import type { FastifyInstance } from 'fastify'
import { ZipArchive } from 'archiver'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { autenticar } from '../auth/middleware.js'
import { UPLOADS_DIR } from '../lib/uploads.js'

// backend/src/routes/backup.ts -> backend/src -> backend
const DIR_BACKEND = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DB_PATH = path.join(DIR_BACKEND, 'data', 'consultorio.db')

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
