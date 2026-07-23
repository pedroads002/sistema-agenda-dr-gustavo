import { api } from '@/lib/api'
import { LABEL_ORIGEM, type Origem } from '@/lib/pacientes'

export const STATUS_AGENDAMENTO = ['a_confirmar', 'confirmado', 'compareceu', 'desmarcou', 'faltou'] as const
export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number]

export const LABEL_STATUS: Record<StatusAgendamento, string> = {
  a_confirmar: 'A confirmar',
  confirmado: 'Confirmado',
  compareceu: 'Compareceu',
  desmarcou: 'Desmarcou',
  faltou: 'Faltou',
}

/** Cores coerentes com o design system (ver ADENDO-01-AGENDA.md). */
export const COR_STATUS: Record<StatusAgendamento, string> = {
  a_confirmar: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
  confirmado: 'bg-primary/15 text-primary border-primary/40',
  compareceu: 'bg-[#3AA76D]/15 text-[#3AA76D] border-[#3AA76D]/40',
  desmarcou: 'bg-muted text-muted-foreground border-border',
  faltou: 'bg-[#D99120]/15 text-[#D99120] border-[#D99120]/40',
}

export type Agendamento = {
  id: string
  pacienteId: string
  paciente: { id: string; nome: string; telefone: string | null; origem: string | null }
  localId: string | null
  local: { id: string; nome: string; cidade: string; uf: string } | null
  inicio: string
  fim: string | null
  procedimentoNome: string | null
  descricao: string | null
  status: StatusAgendamento
  observacoes: string | null
  criadoEm: string
}

export type DadosAgendamento = {
  pacienteId: string
  localId?: string
  data: string
  horaInicio: string
  horaFim: string
  procedimentoNome?: string
  descricao?: string
  status: StatusAgendamento
  observacoes?: string
  forcarConflito?: boolean
}

export function listarAgendamentos(de: string, ate: string, localId?: string) {
  const query = new URLSearchParams({ de, ate })
  if (localId) query.set('localId', localId)
  return api<{ agendamentos: Agendamento[] }>(`/agendamentos?${query.toString()}`)
}

export function listarAgendamentosDoPaciente(pacienteId: string) {
  const query = new URLSearchParams({ pacienteId })
  return api<{ agendamentos: Agendamento[] }>(`/agendamentos?${query.toString()}`)
}

export function buscarAgendamento(id: string) {
  return api<{ agendamento: Agendamento }>(`/agendamentos/${id}`)
}

export function criarAgendamento(dados: DadosAgendamento) {
  return api<{ agendamento: Agendamento }>('/agendamentos', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarAgendamento(id: string, dados: DadosAgendamento) {
  return api<{ agendamento: Agendamento }>(`/agendamentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}

export function removerAgendamento(id: string) {
  return api<null>(`/agendamentos/${id}`, { method: 'DELETE' })
}

const FUSO = 'America/Sao_Paulo'

/** Extrai a data (YYYY-MM-DD) de um instante ISO, no fuso de Brasília. */
export function dataBrasilia(isoOuData: string | Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoOuData))
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value
  return `${obter('year')}-${obter('month')}-${obter('day')}`
}

/** Extrai a hora (HH:MM) de um instante ISO, no fuso de Brasília. */
export function horaBrasilia(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function hojeBrasilia(): string {
  return dataBrasilia(new Date())
}

/** Soma (ou subtrai) dias a uma data "YYYY-MM-DD", sem depender de fuso horário. */
export function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** 0 = domingo ... 6 = sábado */
export function diaDaSemana(data: string): number {
  return new Date(`${data}T00:00:00.000Z`).getUTCDay()
}

export function inicioDaSemana(data: string): string {
  return addDias(data, -diaDaSemana(data))
}

export function inicioDoMes(data: string): string {
  return `${data.slice(0, 7)}-01`
}

export function fimDoMes(data: string): string {
  const d = new Date(`${data.slice(0, 7)}-01T00:00:00.000Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}

export function somarMeses(data: string, quantidade: number): string {
  const d = new Date(`${data.slice(0, 7)}-01T00:00:00.000Z`)
  d.setUTCMonth(d.getUTCMonth() + quantidade)
  return d.toISOString().slice(0, 10)
}

export function formatarDataLonga(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'full' }).format(
    new Date(`${data}T00:00:00.000Z`),
  )
}

export function formatarDataCurta(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'short' }).format(
    new Date(`${data}T00:00:00.000Z`),
  )
}

/** Soma minutos a um horário "HH:MM" e devolve outro "HH:MM". */
export function somarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  const hh = Math.floor((total % (24 * 60)) / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function linkWhatsappConfirmacao(
  telefone: string | null,
  nomePaciente: string,
  data: string,
  horaInicio: string,
): string | null {
  if (!telefone) return null
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null
  const mensagem = `Olá, ${nomePaciente}! Confirmando seu horário no dia ${formatarDataCurta(data)} às ${horaInicio} com o Dr. Gustavo Amaral. Podemos confirmar sua presença?`
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}`
}

export function origemLabel(origem: string | null): string | null {
  return origem ? LABEL_ORIGEM[origem as Origem] : null
}
