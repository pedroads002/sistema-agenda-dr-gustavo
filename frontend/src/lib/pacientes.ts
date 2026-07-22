import { api } from '@/lib/api'

export const SEXOS = ['feminino', 'masculino', 'outro'] as const
export type Sexo = (typeof SEXOS)[number]

export const ORIGENS = ['trafego_pago', 'organico', 'indicacao', 'retorno', 'outro'] as const
export type Origem = (typeof ORIGENS)[number]

export const LABEL_SEXO: Record<Sexo, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  outro: 'Outro',
}

export const LABEL_ORIGEM: Record<Origem, string> = {
  trafego_pago: 'Tráfego pago/Marketing',
  organico: 'Orgânico',
  indicacao: 'Indicação',
  retorno: 'Retorno',
  outro: 'Outro',
}

export type Paciente = {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  nascimento: string | null
  sexo: string | null
  cidade: string | null
  uf: string | null
  endereco: string | null
  origem: string | null
  observacoes: string | null
  criadoEm: string
  atualizadoEm: string
}

export type DadosPaciente = {
  nome: string
  cpf?: string
  telefone?: string
  email?: string
  nascimento?: string
  sexo?: string
  cidade?: string
  uf?: string
  endereco?: string
  origem?: string
  observacoes?: string
}

export function listarPacientes(busca?: string) {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : ''
  return api<{ pacientes: Paciente[] }>(`/pacientes${query}`)
}

export function buscarPaciente(id: string) {
  return api<{ paciente: Paciente }>(`/pacientes/${id}`)
}

export function criarPaciente(dados: DadosPaciente) {
  return api<{ paciente: Paciente }>('/pacientes', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarPaciente(id: string, dados: DadosPaciente) {
  return api<{ paciente: Paciente }>(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}

export function removerPaciente(id: string) {
  return api<null>(`/pacientes/${id}`, { method: 'DELETE' })
}

export function formatarTelefone(telefone: string | null | undefined): string {
  if (!telefone) return ''
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return telefone
}

/** Gera o link wa.me (sem API paga) para abrir o WhatsApp já com a mensagem pronta. */
export function linkWhatsapp(telefone: string | null | undefined, mensagem: string): string | null {
  if (!telefone) return null
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`
}

/** Data de nascimento é só uma data (sem hora) — formata em UTC pra não deslocar de dia por fuso. */
export function formatarDataNascimento(data: string | null | undefined): string {
  if (!data) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}

export function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data))
}
