import { api } from '@/lib/api'

/**
 * Modelo inicial de perguntas da anamnese (adendo 03). Ponto de partida — o Dr. Gustavo
 * pode revisar/ajustar esta lista depois; basta editar este array.
 */
export const PERGUNTAS_PADRAO: { chave: string; pergunta: string; placeholder: string }[] = [
  { chave: 'alergias', pergunta: 'Possui alergias?', placeholder: 'Quais?' },
  { chave: 'medicamentos', pergunta: 'Usa medicamentos contínuos?', placeholder: 'Quais?' },
  { chave: 'doencas_cronicas', pergunta: 'Tem doenças crônicas?', placeholder: 'Quais?' },
  { chave: 'gestante_amamentando', pergunta: 'Está gestante ou amamentando?', placeholder: 'Detalhes' },
  { chave: 'anticoagulantes', pergunta: 'Usa anticoagulantes?', placeholder: 'Quais?' },
  { chave: 'herpes', pergunta: 'Tem histórico de herpes?', placeholder: 'Detalhes' },
  { chave: 'queloide', pergunta: 'Tem tendência a queloide?', placeholder: 'Detalhes' },
  {
    chave: 'procedimentos_anteriores',
    pergunta: 'Já fez procedimentos estéticos antes?',
    placeholder: 'Quais/quando?',
  },
  { chave: 'cirurgias_recentes', pergunta: 'Fez cirurgias recentes?', placeholder: 'Quais/quando?' },
]

export type PerguntaAnamnese = {
  chave: string
  pergunta: string
  resposta: boolean
  detalhe?: string
}

export type Anamnese = {
  id: string
  pacienteId: string
  data: string
  criadoEm: string
  perguntas: PerguntaAnamnese[]
  observacoes: string | null
}

export type DadosAnamnese = {
  pacienteId: string
  data?: string
  perguntas: PerguntaAnamnese[]
  observacoes?: string
}

export function listarAnamneses(pacienteId: string) {
  const query = new URLSearchParams({ pacienteId })
  return api<{ anamneses: Anamnese[] }>(`/anamneses?${query.toString()}`)
}

export function buscarAnamnese(id: string) {
  return api<{ anamnese: Anamnese }>(`/anamneses/${id}`)
}

export function criarAnamnese(dados: DadosAnamnese) {
  return api<{ anamnese: Anamnese }>('/anamneses', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarAnamnese(id: string, dados: DadosAnamnese) {
  return api<{ anamnese: Anamnese }>(`/anamneses/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}

export function removerAnamnese(id: string) {
  return api<null>(`/anamneses/${id}`, { method: 'DELETE' })
}

/** Data "só dia" (sem hora) — formata em UTC, igual ao padrão usado em orçamentos/prontuário. */
export function formatarDataAnamnese(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}
