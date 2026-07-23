import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Wallet, Landmark, Pencil, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatarMoeda } from '@/lib/utils'
import { inicioDoMes, fimDoMes, hojeBrasilia, somarMeses } from '@/lib/agendamentos'
import { listarOrcamentos, calcularSaldo } from '@/lib/orcamentos'
import { FormularioPagamento } from '@/components/pagamento/FormularioPagamento'
import {
  listarPagamentos,
  totalRecebido,
  agruparPorForma,
  agruparPorProcedimento,
  formatarDataPagamento,
  type Pagamento,
} from '@/lib/pagamentos'

export function Financeiro() {
  const queryClient = useQueryClient()
  const [mesReferencia, setMesReferencia] = useState(hojeBrasilia())
  const [editando, setEditando] = useState<Pagamento | null>(null)
  const [criando, setCriando] = useState(false)

  const de = inicioDoMes(mesReferencia)
  const ate = fimDoMes(mesReferencia)

  const { data: dadosPagamentos, isLoading } = useQuery({
    queryKey: ['pagamentos', de, ate],
    queryFn: () => listarPagamentos({ de, ate }),
  })
  const { data: dadosAprovados } = useQuery({
    queryKey: ['orcamentos', 'aprovado'],
    queryFn: () => listarOrcamentos('aprovado'),
  })

  const pagamentos = dadosPagamentos?.pagamentos ?? []
  const aprovados = dadosAprovados?.orcamentos ?? []

  const totalPeriodo = totalRecebido(pagamentos)
  const totalAReceber = aprovados.reduce((soma, orcamento) => soma + calcularSaldo(orcamento).saldo, 0)
  const porForma = agruparPorForma(pagamentos)
  const porProcedimento = agruparPorProcedimento(pagamentos)

  const rotuloMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${de}T00:00:00.000Z`),
  )
  const tituloMes = rotuloMes.charAt(0).toUpperCase() + rotuloMes.slice(1)

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Pagamentos recebidos e saldo a receber</p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo pagamento
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setMesReferencia((m) => somarMeses(m, -1))} aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMesReferencia(hojeBrasilia())}>
          Hoje
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => setMesReferencia((m) => somarMeses(m, 1))} aria-label="Próximo mês">
          <ChevronRight className="size-4" />
        </Button>
        <p className="ml-2 text-sm font-medium text-foreground">{tituloMes}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Wallet className="size-4 text-[#3AA76D]" />
            <CardTitle className="text-sm">Total recebido no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatarMoeda(totalPeriodo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Landmark className="size-4 text-[#D99120]" />
            <CardTitle className="text-sm">Total a receber (orçamentos aprovados)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatarMoeda(totalAReceber)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recebido por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {porForma.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum recebimento no período.</p>
            ) : (
              <div className="space-y-3">
                {porForma.map((item) => (
                  <Barra key={item.rotulo} rotulo={item.rotulo} valor={item.valor} maximo={porForma[0].valor} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recebido por procedimento</CardTitle>
          </CardHeader>
          <CardContent>
            {porProcedimento.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum recebimento no período.</p>
            ) : (
              <div className="space-y-3">
                {porProcedimento.map((item) => (
                  <Barra key={item.rotulo} rotulo={item.rotulo} valor={item.valor} maximo={porProcedimento[0].valor} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Pagamentos do período</p>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : pagamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Wallet className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum pagamento neste período.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pagamentos.map((pagamento) => (
              <li key={pagamento.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/pacientes/${pagamento.pacienteId}`} className="text-sm font-medium text-foreground hover:underline">
                      {pagamento.paciente.nome}
                    </Link>
                    <span className="text-sm font-semibold text-[#3AA76D]">{formatarMoeda(pagamento.valor)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatarDataPagamento(pagamento.data)}
                    {' · '}
                    {pagamento.forma}
                    {pagamento.referencia && ` · ${pagamento.referencia}`}
                  </p>
                  {pagamento.orcamentoId && (
                    <Link
                      to={`/orcamentos/${pagamento.orcamentoId}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileText className="size-3" />
                      Ver orçamento vinculado
                    </Link>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditando(pagamento)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormularioPagamento
        aberto={criando || Boolean(editando)}
        pagamento={editando}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setEditando(null)
            setCriando(false)
          }
        }}
        onSalvo={aoSalvar}
      />
    </div>
  )
}

function Barra({ rotulo, valor, maximo }: { rotulo: string; valor: number; maximo: number }) {
  const largura = maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate text-muted-foreground">{rotulo}</span>
        <span className="shrink-0 font-medium text-foreground">{formatarMoeda(valor)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${largura}%` }} />
      </div>
    </div>
  )
}
