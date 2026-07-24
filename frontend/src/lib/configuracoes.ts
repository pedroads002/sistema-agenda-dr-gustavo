import { api } from '@/lib/api'

export type Configuracao = {
  id: string
  nomeConsultorio: string
  nomeProfissional: string
  registroProfissional: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  atualizadoEm: string
}

export type DadosConfiguracao = {
  nomeConsultorio: string
  nomeProfissional: string
  registroProfissional?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  uf?: string
}

export function buscarConfiguracoes() {
  return api<{ configuracao: Configuracao }>('/configuracoes')
}

export function atualizarConfiguracoes(dados: DadosConfiguracao) {
  return api<{ configuracao: Configuracao }>('/configuracoes', {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}
