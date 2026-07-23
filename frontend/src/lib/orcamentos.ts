import { api } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'

export const STATUS_ORCAMENTO = ['pendente', 'aprovado', 'recusado'] as const
export type StatusOrcamento = (typeof STATUS_ORCAMENTO)[number]

export const LABEL_STATUS_ORCAMENTO: Record<StatusOrcamento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
}

/** Cores coerentes com o design system (ver COR_STATUS de lib/agendamentos.ts). */
export const COR_STATUS_ORCAMENTO: Record<StatusOrcamento, string> = {
  pendente: 'bg-[#D99120]/15 text-[#D99120] border-[#D99120]/40',
  aprovado: 'bg-[#3AA76D]/15 text-[#3AA76D] border-[#3AA76D]/40',
  recusado: 'bg-destructive/10 text-destructive border-destructive/40',
}

export type ItemOrcamento = {
  id: string
  orcamentoId: string
  descricao: string
  quantidade: number
  valorUnit: number
}

export type Pagamento = {
  id: string
  valor: number
  data: string
  forma: string
}

export type Orcamento = {
  id: string
  pacienteId: string
  paciente: {
    id: string
    nome: string
    telefone: string | null
    cpf: string | null
    endereco: string | null
    cidade: string | null
    uf: string | null
  }
  data: string
  validoAte: string | null
  status: StatusOrcamento
  desconto: number
  observacoes: string | null
  criadoEm: string
  itens: ItemOrcamento[]
  pagamentos: Pagamento[]
}

export type DadosItemOrcamento = {
  descricao: string
  quantidade: number
  valorUnit: number
}

export type DadosOrcamento = {
  pacienteId: string
  data?: string
  validoAte?: string
  status: StatusOrcamento
  desconto: number
  observacoes?: string
  itens: DadosItemOrcamento[]
}

export function listarOrcamentos(status?: string, pacienteId?: string) {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (pacienteId) query.set('pacienteId', pacienteId)
  const texto = query.toString()
  return api<{ orcamentos: Orcamento[] }>(`/orcamentos${texto ? `?${texto}` : ''}`)
}

export function buscarOrcamento(id: string) {
  return api<{ orcamento: Orcamento }>(`/orcamentos/${id}`)
}

export function criarOrcamento(dados: DadosOrcamento) {
  return api<{ orcamento: Orcamento }>('/orcamentos', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarOrcamento(id: string, dados: DadosOrcamento) {
  return api<{ orcamento: Orcamento }>(`/orcamentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}

export function removerOrcamento(id: string) {
  return api<null>(`/orcamentos/${id}`, { method: 'DELETE' })
}

/** Subtotal (soma dos itens), desconto e total do orçamento. */
export function calcularTotais(itens: { quantidade: number; valorUnit: number }[], desconto: number) {
  const subtotal = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnit, 0)
  const total = Math.max(0, subtotal - desconto)
  return { subtotal, desconto, total }
}

/** Quanto já foi pago (Fase 6) e o saldo restante. Sem pagamentos ainda, pago fica em zero. */
export function calcularSaldo(orcamento: Orcamento) {
  const { total } = calcularTotais(orcamento.itens, orcamento.desconto)
  const pago = orcamento.pagamentos.reduce((soma, pagamento) => soma + pagamento.valor, 0)
  return { total, pago, saldo: Math.max(0, total - pago) }
}

/** Data "só dia" (sem hora) — formata em UTC pra não deslocar por fuso, igual ao prontuário. */
export function formatarDataOrcamento(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}

/** Monta o texto do orçamento formatado para envio por WhatsApp (link wa.me, sem serviço externo). */
export function linkWhatsappOrcamento(orcamento: Orcamento): string | null {
  const telefone = orcamento.paciente.telefone
  if (!telefone) return null
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null

  const { subtotal, total } = calcularTotais(orcamento.itens, orcamento.desconto)
  const linhasItens = orcamento.itens
    .map((item) => `• ${item.descricao} (x${item.quantidade}) — ${formatarMoeda(item.quantidade * item.valorUnit)}`)
    .join('\n')

  const partes = [
    `Olá, ${orcamento.paciente.nome}! Segue o orçamento do consultório do Dr. Gustavo Amaral:`,
    '',
    linhasItens,
    '',
    `Subtotal: ${formatarMoeda(subtotal)}`,
  ]
  if (orcamento.desconto > 0) partes.push(`Desconto: ${formatarMoeda(orcamento.desconto)}`)
  partes.push(`Total: ${formatarMoeda(total)}`)
  if (orcamento.validoAte) partes.push(`Válido até: ${formatarDataOrcamento(orcamento.validoAte)}`)
  if (orcamento.observacoes) partes.push('', orcamento.observacoes)

  return `https://wa.me/55${digitos}?text=${encodeURIComponent(partes.join('\n'))}`
}
