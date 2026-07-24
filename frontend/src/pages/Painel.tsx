import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarPlus,
  UserPlus,
  FileText,
  Wallet,
  Landmark,
  Users,
  Clock,
  CalendarClock,
  Cake,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatarMoeda } from '@/lib/utils'
import { horaBrasilia, dataBrasilia, formatarDataCurta, LABEL_STATUS, COR_STATUS, type Agendamento } from '@/lib/agendamentos'
import { buscarPainel } from '@/lib/painel'

export function Painel() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['painel'],
    queryFn: buscarPainel,
  })

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Painel</h1>
          <p className="text-sm text-muted-foreground">Resumo do consultório</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link to="/agenda?novo=1">
              <CalendarPlus className="size-4" />
              Novo agendamento
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/pacientes/novo">
              <UserPlus className="size-4" />
              Novo paciente
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/orcamentos?novo=1">
              <FileText className="size-4" />
              Novo orçamento
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Carregando painel...</p>
      ) : isError || !data ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar os dados do painel.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              icone={Wallet}
              cor="#3AA76D"
              titulo="Recebido no mês"
              valor={formatarMoeda(data.recebidoNoMes)}
            />
            <Indicador
              icone={Landmark}
              cor="#D99120"
              titulo="A receber (aprovados)"
              valor={formatarMoeda(data.aReceber)}
            />
            <Indicador icone={Users} cor="#3892AB" titulo="Pacientes cadastrados" valor={String(data.totalPacientes)} />
            <Indicador
              icone={FileText}
              cor="#7DA2B0"
              titulo="Orçamentos pendentes"
              valor={String(data.orcamentosPendentes)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <CardTitle className="text-sm">Atendimentos de hoje</CardTitle>
                </div>
                <Link to="/agenda" className="text-xs text-primary hover:underline">
                  Ver agenda
                </Link>
              </CardHeader>
              <CardContent>
                {data.atendimentosHoje.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nenhum atendimento hoje.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.atendimentosHoje.map((agendamento) => (
                      <ItemAgendamento key={agendamento.id} agendamento={agendamento} mostrarData={false} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <CardTitle className="text-sm">Próximos agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {data.proximosAgendamentos.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.proximosAgendamentos.map((agendamento) => (
                      <ItemAgendamento key={agendamento.id} agendamento={agendamento} mostrarData />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center gap-2">
                <Cake className="size-4 text-primary" />
                <CardTitle className="text-sm">Aniversariantes dos próximos 30 dias</CardTitle>
              </CardHeader>
              <CardContent>
                {data.aniversariantes.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum aniversariante nos próximos 30 dias.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {data.aniversariantes.map((pessoa) => (
                      <li key={pessoa.id}>
                        <Link
                          to={`/pacientes/${pessoa.id}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
                        >
                          <span className="truncate font-medium text-foreground">{pessoa.nome}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {pessoa.diasAte === 0 ? 'Hoje!' : pessoa.diasAte === 1 ? 'Amanhã' : `Em ${pessoa.diasAte} dias`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function Indicador({
  icone: Icone,
  cor,
  titulo,
  valor,
}: {
  icone: typeof Wallet
  cor: string
  titulo: string
  valor: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Icone className="size-4" style={{ color: cor }} />
        <CardTitle className="text-sm">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{valor}</p>
      </CardContent>
    </Card>
  )
}

function ItemAgendamento({ agendamento, mostrarData }: { agendamento: Agendamento; mostrarData: boolean }) {
  return (
    <li>
      <Link
        to={`/pacientes/${agendamento.pacienteId}`}
        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{agendamento.paciente.nome}</p>
          <p className="truncate text-xs text-muted-foreground">
            {mostrarData ? `${formatarDataCurta(dataBrasilia(agendamento.inicio))} · ` : ''}
            {horaBrasilia(agendamento.inicio)}
            {agendamento.procedimentoNome ? ` · ${agendamento.procedimentoNome}` : ''}
          </p>
        </div>
        <Badge variant="outline" className={cn('shrink-0 border', COR_STATUS[agendamento.status])}>
          {LABEL_STATUS[agendamento.status]}
        </Badge>
      </Link>
    </li>
  )
}
