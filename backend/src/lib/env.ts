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
  // PORTA é a convenção usada neste projeto (backend/.env); PORT é aceito como alternativa
  // caso o sistema um dia rode atrás de outro serviço que defina essa variável sozinho.
  porta: Number(process.env.PORT) || Number(process.env.PORTA) || 3000,
  // Cookie "secure" exige HTTPS. Localmente (ou atrás do Cloudflare Tunnel sem HTTPS na
  // ponta local) o padrão é não exigir; ligue com COOKIE_SECURE=true só se o acesso externo
  // sempre passar por HTTPS de ponta a ponta.
  cookieSecure: process.env.COOKIE_SECURE === 'true',
}
