const BASE = '/api'

export class ErroApi extends Error {}

function extrairMensagemDeErro(corpo: unknown): string {
  if (corpo && typeof corpo === 'object' && 'erro' in corpo) {
    return String((corpo as { erro: unknown }).erro)
  }
  return 'Erro inesperado. Tente novamente.'
}

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...opcoes,
    headers: {
      ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
      ...opcoes.headers,
    },
    credentials: 'same-origin',
  })

  const corpo = resposta.status !== 204 ? await resposta.json().catch(() => null) : null

  if (!resposta.ok) {
    throw new ErroApi(extrairMensagemDeErro(corpo))
  }

  return corpo as T
}
