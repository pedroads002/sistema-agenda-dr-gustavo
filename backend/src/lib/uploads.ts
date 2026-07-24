import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// backend/src/uploads — fora do Git (.gitignore), servido só por rota autenticada.
export const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')

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
