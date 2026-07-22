import { api } from '@/lib/api'

export type Local = {
  id: string
  nome: string
  cidade: string
  uf: string
  endereco: string | null
  ativo: boolean
  criadoEm: string
}

export type DadosLocal = {
  nome: string
  cidade: string
  uf: string
  endereco?: string
  ativo?: boolean
}

export function listarLocais(todos = false) {
  return api<{ locais: Local[] }>(`/locais${todos ? '?todos=1' : ''}`)
}

export function criarLocal(dados: DadosLocal) {
  return api<{ local: Local }>('/locais', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarLocal(id: string, dados: DadosLocal) {
  return api<{ local: Local }>(`/locais/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}
