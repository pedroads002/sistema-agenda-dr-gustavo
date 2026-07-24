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
  // PORT é a variável padrão que serviços como o Railway definem sozinhos; PORTA é a
  // convenção usada localmente (backend/.env). PORT tem prioridade quando existir.
  porta: Number(process.env.PORT) || Number(process.env.PORTA) || 3333,
  // Em produção com HTTPS (ex.: Railway), o cookie de sessão deve exigir conexão segura.
  // Localmente, o sistema roda sem HTTPS por desenho, então o padrão é não exigir.
  cookieSecure: process.env.COOKIE_SECURE === 'true',
}
