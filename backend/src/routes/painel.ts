import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { autenticar } from '../auth/middleware.js'

const DIAS_JANELA_ANIVERSARIO = 30
const LIMITE_PROXIMOS_AGENDAMENTOS = 5
const LIMITE_ANIVERSARIANTES = 10

/** O Brasil não usa mais horário de verão, então o deslocamento -03:00 é fixo o ano todo
 * (mesma convenção usada em routes/agendamentos.ts). */
function hojeBrasiliaISO(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value
  return `${obter('year')}-${obter('month')}-${obter('day')}`
}

function paraInstanteBrasilia(data: string, hora: string): Date {
  return new Date(`${data}T${hora}:00-03:00`)
}

function inicioDoMes(data: string): string {
  return `${data.slice(0, 7)}-01`
}

function fimDoMes(data: string): string {
  const d = new Date(`${data.slice(0, 7)}-01T00:00:00.000Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}

const INCLUDE_AGENDAMENTO = {
  paciente: { select: { id: true, nome: true, telefone: true, origem: true } },
  local: { select: { id: true, nome: true, cidade: true, uf: true } },
} as const

export async function rotasPainel(app: FastifyInstance) {
  app.get('/api/painel', { preHandler: autenticar }, async () => {
    const hoje = hojeBrasiliaISO()
    const inicioHoje = paraInstanteBrasilia(hoje, '00:00')
    const fimHoje = paraInstanteBrasilia(hoje, '23:59')
    const inicioMes = new Date(`${inicioDoMes(hoje)}T00:00:00.000Z`)
    const fimMes = new Date(`${fimDoMes(hoje)}T23:59:59.999Z`)

    const [
      atendimentosHoje,
      proximosAgendamentos,
      pagamentosDoMes,
      orcamentosAprovados,
      totalPacientes,
      orcamentosPendentes,
      pacientesComNascimento,
    ] = await Promise.all([
      prisma.agendamento.findMany({
        where: { inicio: { gte: inicioHoje, lte: fimHoje } },
        include: INCLUDE_AGENDAMENTO,
        orderBy: { inicio: 'asc' },
      }),
      prisma.agendamento.findMany({
        where: { inicio: { gt: fimHoje } },
        include: INCLUDE_AGENDAMENTO,
        orderBy: { inicio: 'asc' },
        take: LIMITE_PROXIMOS_AGENDAMENTOS,
      }),
      prisma.pagamento.findMany({
        where: { data: { gte: inicioMes, lte: fimMes } },
        select: { valor: true },
      }),
      prisma.orcamento.findMany({
        where: { status: 'aprovado' },
        select: {
          desconto: true,
          itens: { select: { quantidade: true, valorUnit: true } },
          pagamentos: { select: { valor: true } },
        },
      }),
      prisma.paciente.count(),
      prisma.orcamento.count({ where: { status: 'pendente' } }),
      prisma.paciente.findMany({
        where: { nascimento: { not: null } },
        select: { id: true, nome: true, nascimento: true },
      }),
    ])

    const recebidoNoMes = pagamentosDoMes.reduce((soma, p) => soma + p.valor, 0)

    const aReceber = orcamentosAprovados.reduce((soma, orcamento) => {
      const subtotal = orcamento.itens.reduce((s, item) => s + item.quantidade * item.valorUnit, 0)
      const total = Math.max(0, subtotal - orcamento.desconto)
      const pago = orcamento.pagamentos.reduce((s, p) => s + p.valor, 0)
      return soma + Math.max(0, total - pago)
    }, 0)

    const hojeSemHora = new Date(`${hoje}T00:00:00.000Z`)
    const aniversariantes = pacientesComNascimento
      .map((paciente) => {
        const nascimento = paciente.nascimento!
        let proximo = new Date(Date.UTC(hojeSemHora.getUTCFullYear(), nascimento.getUTCMonth(), nascimento.getUTCDate()))
        if (proximo < hojeSemHora) {
          proximo = new Date(Date.UTC(hojeSemHora.getUTCFullYear() + 1, nascimento.getUTCMonth(), nascimento.getUTCDate()))
        }
        const diasAte = Math.round((proximo.getTime() - hojeSemHora.getTime()) / 86400000)
        return { id: paciente.id, nome: paciente.nome, nascimento, diasAte }
      })
      .filter((p) => p.diasAte <= DIAS_JANELA_ANIVERSARIO)
      .sort((a, b) => a.diasAte - b.diasAte)
      .slice(0, LIMITE_ANIVERSARIANTES)

    return {
      hoje,
      atendimentosHoje,
      proximosAgendamentos,
      recebidoNoMes,
      aReceber,
      totalPacientes,
      orcamentosPendentes,
      aniversariantes,
    }
  })
}
