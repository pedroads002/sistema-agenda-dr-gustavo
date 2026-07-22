try {
  process.loadEnvFile()
} catch {
  // Sem arquivo .env — assume que as variáveis já foram definidas de outra forma
}

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida. Confira o arquivo backend/.env`)
  }
  return valor
}

export const env = {
  jwtSecret: obrigatoria('JWT_SECRET'),
  porta: Number(process.env.PORTA) || 3333,
}
