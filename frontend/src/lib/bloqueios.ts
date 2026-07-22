import { api } from '@/lib/api'

export type Bloqueio = {
  id: string
  data: string
  diaInteiro: boolean
  horaInicio: string | null
  horaFim: string | null
  motivo: string | null
  criadoEm: string
}

export type DadosBloqueio = {
  data: string
  diaInteiro: boolean
  horaInicio?: string
  horaFim?: string
  motivo?: string
}

export function listarBloqueios(de?: string, ate?: string) {
  const query = de && ate ? `?de=${de}&ate=${ate}` : ''
  return api<{ bloqueios: Bloqueio[] }>(`/bloqueios${query}`)
}

export function criarBloqueio(dados: DadosBloqueio) {
  return api<{ bloqueio: Bloqueio }>('/bloqueios', { method: 'POST', body: JSON.stringify(dados) })
}

export function removerBloqueio(id: string) {
  return api<null>(`/bloqueios/${id}`, { method: 'DELETE' })
}

/** Data do bloqueio é só um dia (sem hora) — formata em UTC pra não deslocar por fuso. */
export function formatarDataBloqueio(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'short' }).format(new Date(data))
}
