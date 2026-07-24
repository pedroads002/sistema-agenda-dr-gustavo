const BASE = '/api'

export class ErroApi extends Error {
  status: number
  tipo?: string

  constructor(message: string, status: number, tipo?: string) {
    super(message)
    this.status = status
    this.tipo = tipo
  }
}

function extrairMensagemDeErro(corpo: unknown): string {
  if (corpo && typeof corpo === 'object' && 'erro' in corpo) {
    return String((corpo as { erro: unknown }).erro)
  }
  return 'Erro inesperado. Tente novamente.'
}

function extrairTipoDeErro(corpo: unknown): string | undefined {
  if (corpo && typeof corpo === 'object' && 'tipo' in corpo) {
    return String((corpo as { tipo: unknown }).tipo)
  }
  return undefined
}

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...opcoes,
    headers: {
      ...(opcoes.body && !(opcoes.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...opcoes.headers,
    },
    credentials: 'same-origin',
  })

  const corpo = resposta.status !== 204 ? await resposta.json().catch(() => null) : null

  if (!resposta.ok) {
    throw new ErroApi(extrairMensagemDeErro(corpo), resposta.status, extrairTipoDeErro(corpo))
  }

  return corpo as T
}
