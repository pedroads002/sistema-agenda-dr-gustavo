import { api } from '@/lib/api'

export const CATEGORIAS_PROCEDIMENTO = ['intima_masculina', 'intima_feminina', 'corporal', 'facial', 'outros'] as const
export type CategoriaProcedimento = (typeof CATEGORIAS_PROCEDIMENTO)[number]

export const LABEL_CATEGORIA: Record<CategoriaProcedimento, string> = {
  intima_masculina: 'Íntima masculina',
  intima_feminina: 'Íntima feminina',
  corporal: 'Corporal',
  facial: 'Facial',
  outros: 'Outros',
}

export type Procedimento = {
  id: string
  nome: string
  categoria: string
  valorBase: number
  duracaoMin: number
  ordem: number
  ativo: boolean
}

export type DadosProcedimento = {
  nome: string
  categoria: string
  valorBase: number
  duracaoMin: number
  ordem: number
  ativo?: boolean
}

export function listarProcedimentos(todos = false) {
  const query = todos ? '?todos=1' : ''
  return api<{ procedimentos: Procedimento[] }>(`/procedimentos${query}`)
}

export function buscarProcedimento(id: string) {
  return api<{ procedimento: Procedimento }>(`/procedimentos/${id}`)
}

export function criarProcedimento(dados: DadosProcedimento) {
  return api<{ procedimento: Procedimento }>('/procedimentos', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarProcedimento(id: string, dados: DadosProcedimento) {
  return api<{ procedimento: Procedimento }>(`/procedimentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}
