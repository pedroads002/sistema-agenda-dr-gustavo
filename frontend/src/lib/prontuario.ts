import { api } from '@/lib/api'

export type ProdutoAplicado = {
  id: string
  produto: string | null
  lote: string | null
  validade: string | null
  quantidade: string | null
  regiao: string | null
}

export type DadosProdutoAplicado = {
  produto?: string
  lote?: string
  validade?: string
  quantidade?: string
  regiao?: string
}

export type RegistroProntuario = {
  id: string
  pacienteId: string
  agendamentoId: string | null
  data: string
  procedimento: string
  observacoes: string | null
  criadoEm: string
  produtos: ProdutoAplicado[]
}

export type DadosRegistroProntuario = {
  agendamentoId?: string
  data: string
  procedimento: string
  observacoes?: string
  produtos: DadosProdutoAplicado[]
}

export function listarProntuario(pacienteId: string) {
  return api<{ registros: RegistroProntuario[] }>(`/pacientes/${pacienteId}/prontuario`)
}

export function criarRegistroProntuario(pacienteId: string, dados: DadosRegistroProntuario) {
  return api<{ registro: RegistroProntuario }>(`/pacientes/${pacienteId}/prontuario`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function atualizarRegistroProntuario(pacienteId: string, id: string, dados: DadosRegistroProntuario) {
  return api<{ registro: RegistroProntuario }>(`/pacientes/${pacienteId}/prontuario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}

export function removerRegistroProntuario(pacienteId: string, id: string) {
  return api<null>(`/pacientes/${pacienteId}/prontuario/${id}`, { method: 'DELETE' })
}
