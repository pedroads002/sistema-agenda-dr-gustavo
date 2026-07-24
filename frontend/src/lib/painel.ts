import { api } from '@/lib/api'
import type { Agendamento } from '@/lib/agendamentos'

export type Aniversariante = {
  id: string
  nome: string
  nascimento: string
  diasAte: number
}

export type DadosPainel = {
  hoje: string
  atendimentosHoje: Agendamento[]
  proximosAgendamentos: Agendamento[]
  recebidoNoMes: number
  aReceber: number
  totalPacientes: number
  orcamentosPendentes: number
  aniversariantes: Aniversariante[]
}

export function buscarPainel() {
  return api<DadosPainel>('/painel')
}
