import { api } from '@/lib/api'

export const FORMAS_PAGAMENTO = [
  'Pix',
  'Dinheiro',
  'Cartão débito',
  'Cartão crédito',
  'Transferência',
  'Outro',
] as const
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]

export type ItemOrcamentoResumo = { descricao: string; quantidade: number; valorUnit: number }

export type Pagamento = {
  id: string
  pacienteId: string
  paciente: { id: string; nome: string; telefone: string | null }
  orcamentoId: string | null
  orcamento: { id: string; status: string; desconto: number; itens: ItemOrcamentoResumo[] } | null
  data: string
  valor: number
  forma: FormaPagamento
  referencia: string | null
  criadoEm: string
}

export type DadosPagamento = {
  pacienteId: string
  orcamentoId?: string
  data?: string
  valor: number
  forma: FormaPagamento
  referencia?: string
}

export function listarPagamentos(opcoes?: {
  de?: string
  ate?: string
  pacienteId?: string
  orcamentoId?: string
}) {
  const query = new URLSearchParams()
  if (opcoes?.de) query.set('de', opcoes.de)
  if (opcoes?.ate) query.set('ate', opcoes.ate)
  if (opcoes?.pacienteId) query.set('pacienteId', opcoes.pacienteId)
  if (opcoes?.orcamentoId) query.set('orcamentoId', opcoes.orcamentoId)
  const texto = query.toString()
  return api<{ pagamentos: Pagamento[] }>(`/pagamentos${texto ? `?${texto}` : ''}`)
}

export function buscarPagamento(id: string) {
  return api<{ pagamento: Pagamento }>(`/pagamentos/${id}`)
}

export function criarPagamento(dados: DadosPagamento) {
  return api<{ pagamento: Pagamento }>('/pagamentos', { method: 'POST', body: JSON.stringify(dados) })
}

export function atualizarPagamento(id: string, dados: DadosPagamento) {
  return api<{ pagamento: Pagamento }>(`/pagamentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) })
}

export function removerPagamento(id: string) {
  return api<null>(`/pagamentos/${id}`, { method: 'DELETE' })
}

/** Data "só dia" (sem hora) — formata em UTC, igual ao padrão usado em orçamentos/prontuário. */
export function formatarDataPagamento(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}

/** Soma total recebido (sum de valor) de uma lista de pagamentos. */
export function totalRecebido(pagamentos: Pagamento[]): number {
  return pagamentos.reduce((soma, pagamento) => soma + pagamento.valor, 0)
}

/** Quebra o total recebido por forma de pagamento, ordenado do maior para o menor. */
export function agruparPorForma(pagamentos: Pagamento[]): { rotulo: string; valor: number }[] {
  const mapa = new Map<string, number>()
  for (const pagamento of pagamentos) {
    mapa.set(pagamento.forma, (mapa.get(pagamento.forma) ?? 0) + pagamento.valor)
  }
  return Array.from(mapa.entries())
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor)
}

const SEM_ORCAMENTO = 'Sem orçamento vinculado'

/**
 * Quebra o total recebido por procedimento, distribuindo cada pagamento vinculado a um
 * orçamento proporcionalmente ao peso (quantidade × valor unitário) de cada item nesse
 * orçamento. Pagamentos avulsos (sem orçamento) entram em "Sem orçamento vinculado".
 */
export function agruparPorProcedimento(pagamentos: Pagamento[]): { rotulo: string; valor: number }[] {
  const mapa = new Map<string, number>()

  for (const pagamento of pagamentos) {
    const itens = pagamento.orcamento?.itens ?? []
    const pesoTotal = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnit, 0)

    if (itens.length === 0 || pesoTotal <= 0) {
      mapa.set(SEM_ORCAMENTO, (mapa.get(SEM_ORCAMENTO) ?? 0) + pagamento.valor)
      continue
    }

    for (const item of itens) {
      const peso = (item.quantidade * item.valorUnit) / pesoTotal
      mapa.set(item.descricao, (mapa.get(item.descricao) ?? 0) + pagamento.valor * peso)
    }
  }

  return Array.from(mapa.entries())
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor)
}
