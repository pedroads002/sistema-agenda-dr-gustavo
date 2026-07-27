import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Fora do Git (.gitignore), servido só por rota autenticada.
// Local padrão: backend/uploads (relativo à raiz do backend, não ao arquivo compilado —
// funciona igual em desenvolvimento e em produção). A variável UPLOADS_DIR permite apontar
// para outra pasta, se um dia for necessário.
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads')

const EXTENSAO_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}

export const MIME_IMAGENS = ['image/jpeg', 'image/png', 'image/webp']
export const MIME_DOCUMENTOS = [...MIME_IMAGENS, 'application/pdf']
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024 // 10 MB

/** Salva o arquivo com nome aleatório (nunca o nome original) e devolve o nome gerado. */
export async function salvarArquivo(buffer: Buffer, mimetype: string): Promise<string> {
  const extensao = EXTENSAO_POR_MIME[mimetype]
  if (!extensao) {
    throw new Error(`Tipo de arquivo não suportado: ${mimetype}`)
  }
  await mkdir(UPLOADS_DIR, { recursive: true })
  const nome = `${randomUUID()}${extensao}`
  await writeFile(path.join(UPLOADS_DIR, nome), buffer)
  return nome
}

export async function removerArquivo(nome: string): Promise<void> {
  try {
    await unlink(path.join(UPLOADS_DIR, nome))
  } catch {
    // Arquivo já não existe no disco — nada a fazer.
  }
}

export function streamArquivo(nome: string) {
  return createReadStream(path.join(UPLOADS_DIR, nome))
}
