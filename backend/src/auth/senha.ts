import bcrypt from 'bcrypt'

const CUSTO_HASH = 12

export function gerarHash(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO_HASH)
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}
