import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarOff, ChevronLeft, ChevronRight, Lock, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { listarLocais } from '@/lib/locais'
import { listarBloqueios, type Bloqueio } from '@/lib/bloqueios'
import { listarProcedimentos } from '@/lib/procedimentos'
import { AgendamentoFormulario } from '@/components/agenda/AgendamentoFormulario'
import {
  listarAgendamentos,
  dataBrasilia,
  horaBrasilia,
  hojeBrasilia,
  addDias,
  inicioDaSemana,
  inicioDoMes,
  fimDoMes,
  somarMeses,
  formatarDataLonga,
  formatarDataCurta,
  LABEL_STATUS,
  COR_STATUS,
  type Agendamento,
} from '@/lib/agendamentos'

type Visao = 'dia' | 'semana' | 'mes'

const NOMES_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function calcularIntervalo(visao: Visao, dataReferencia: string) {
  if (visao === 'dia') return { de: dataReferencia, ate: dataReferencia }
  if (visao === 'semana') {
    const inicio = inicioDaSemana(dataReferencia)
    return { de: inicio, ate: addDias(inicio, 6) }
  }
  const gradeInicio = inicioDaSemana(inicioDoMes(dataReferencia))
  const gradeFim = addDias(inicioDaSemana(fimDoMes(dataReferencia)), 6)
  return { de: gradeInicio, ate: gradeFim }
}

function tituloPeriodo(visao: Visao, dataReferencia: string): string {
  if (visao === 'dia') return formatarDataLonga(dataReferencia)
  if (visao === 'semana') {
    const inicio = inicioDaSemana(dataReferencia)
    return `${formatarDataCurta(inicio)} – ${formatarDataCurta(addDias(inicio, 6))}`
  }
  const rotulo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${inicioDoMes(dataReferencia)}T00:00:00.000Z`),
  )
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1)
}

export function Agenda() {
  const queryClient = useQueryClient()
  const [visao, setVisao] = useState<Visao>('semana')
  const [dataReferencia, setDataReferencia] = useState(hojeBrasilia())
  const [localFiltro, setLocalFiltro] = useState('')
  const [formAberto, setFormAberto] = useState(false)
  const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null)
  const [dataParaNovo, setDataParaNovo] = useState<string | undefined>(undefined)

  const { de, ate } = useMemo(() => calcularIntervalo(visao, dataReferencia), [visao, dataReferencia])
  const hoje = hojeBrasilia()

  const { data: dadosLocais } = useQuery({ queryKey: ['locais'], queryFn: () => listarLocais() })
  const { data: dadosProcedimentos } = useQuery({ queryKey: ['procedimentos'], queryFn: () => listarProcedimentos() })
  const { data: dadosAgendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos', de, ate, localFiltro],
    queryFn: () => listarAgendamentos(de, ate, localFiltro || undefined),
  })
  const { data: dadosBloqueios } = useQuery({
    queryKey: ['bloqueios', de, ate],
    queryFn: () => listarBloqueios(de, ate),
  })

  const locais = dadosLocais?.locais ?? []
  const procedimentos = dadosProcedimentos?.procedimentos ?? []

  const agendamentosPorDia = useMemo(() => {
    const mapa = new Map<string, Agendamento[]>()
    for (const agendamento of dadosAgendamentos?.agendamentos ?? []) {
      const chave = dataBrasilia(agendamento.inicio)
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(agendamento)
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
    return mapa
  }, [dadosAgendamentos])

  const bloqueiosPorDia = useMemo(() => {
    const mapa = new Map<string, Bloqueio[]>()
    for (const bloqueio of dadosBloqueios?.bloqueios ?? []) {
      const chave = bloqueio.data.slice(0, 10)
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(bloqueio)
    }
    return mapa
  }, [dadosBloqueios])

  function navegar(direcao: 1 | -1) {
    setDataReferencia((atual) => {
      if (visao === 'dia') return addDias(atual, direcao)
      if (visao === 'semana') return addDias(atual, direcao * 7)
      return somarMeses(atual, direcao)
    })
  }

  function abrirNovo(data?: string) {
    setAgendamentoEditando(null)
    setDataParaNovo(data ?? dataReferencia)
    setFormAberto(true)
  }

  function abrirEdicao(agendamento: Agendamento) {
    setAgendamentoEditando(agendamento)
    setDataParaNovo(undefined)
    setFormAberto(true)
  }

  function irParaDia(data: string) {
    setDataReferencia(data)
    setVisao('dia')
  }

  function aoSalvarAgendamento() {
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    setFormAberto(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Consultas e horários do Dr. Gustavo Amaral</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/agenda/locais">
              <MapPin className="size-4" />
              Locais
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agenda/bloqueios">
              <CalendarOff className="size-4" />
              Bloqueios
            </Link>
          </Button>
          <Button size="sm" onClick={() => abrirNovo()}>
            <Plus className="size-4" />
            Novo agendamento
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex rounded-lg border border-border p-0.5">
          {(['dia', 'semana', 'mes'] as Visao[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisao(v)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                visao === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'dia' ? 'Dia' : v === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navegar(-1)} aria-label="Período anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDataReferencia(hoje)}>
            Hoje
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navegar(1)} aria-label="Próximo período">
            <ChevronRight className="size-4" />
          </Button>
          <p className="min-w-[160px] text-sm font-medium text-foreground">{tituloPeriodo(visao, dataReferencia)}</p>
        </div>

        <div className="w-full lg:w-56">
          <Select value={localFiltro} onValueChange={setLocalFiltro}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os locais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os locais</SelectItem>
              {locais.map((local) => (
                <SelectItem key={local.id} value={local.id}>
                  {local.nome} ({local.cidade}/{local.uf})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : visao === 'dia' ? (
        <VisaoDia
          agendamentos={agendamentosPorDia.get(dataReferencia) ?? []}
          bloqueios={bloqueiosPorDia.get(dataReferencia) ?? []}
          onEditar={abrirEdicao}
          onNovo={() => abrirNovo(dataReferencia)}
        />
      ) : visao === 'semana' ? (
        <VisaoSemana
          dataReferencia={dataReferencia}
          hoje={hoje}
          agendamentosPorDia={agendamentosPorDia}
          bloqueiosPorDia={bloqueiosPorDia}
          onEditar={abrirEdicao}
          onNovo={abrirNovo}
          onAbrirDia={irParaDia}
        />
      ) : (
        <VisaoMes
          dataReferencia={dataReferencia}
          hoje={hoje}
          agendamentosPorDia={agendamentosPorDia}
          bloqueiosPorDia={bloqueiosPorDia}
          onAbrirDia={irParaDia}
        />
      )}

      <AgendamentoFormulario
        aberto={formAberto}
        onOpenChange={setFormAberto}
        agendamento={agendamentoEditando}
        dataInicial={dataParaNovo}
        locais={locais}
        procedimentos={procedimentos}
        onSalvo={aoSalvarAgendamento}
      />
    </div>
  )
}

function CartaoAgendamento({ agendamento, onClick }: { agendamento: Agendamento; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {horaBrasilia(agendamento.inicio)}
          {agendamento.fim ? `–${horaBrasilia(agendamento.fim)}` : ''}
        </span>
        <Badge variant="outline" className={cn('border', COR_STATUS[agendamento.status])}>
          {LABEL_STATUS[agendamento.status]}
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground">{agendamento.paciente.nome}</p>
      <p className="text-xs text-muted-foreground">
        {agendamento.procedimentoNome ?? 'Sem procedimento definido'}
        {agendamento.local ? ` · ${agendamento.local.cidade}/${agendamento.local.uf}` : ''}
      </p>
    </button>
  )
}

function VisaoDia({
  agendamentos,
  bloqueios,
  onEditar,
  onNovo,
}: {
  agendamentos: Agendamento[]
  bloqueios: Bloqueio[]
  onEditar: (agendamento: Agendamento) => void
  onNovo: () => void
}) {
  const bloqueioDiaInteiro = bloqueios.find((b) => b.diaInteiro)
  const bloqueiosParciais = bloqueios.filter((b) => !b.diaInteiro)

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {bloqueioDiaInteiro && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#D99120]/40 bg-[#D99120]/10 px-3 py-2 text-sm text-[#D99120]">
          <Lock className="size-4" />
          Dia bloqueado{bloqueioDiaInteiro.motivo ? `: ${bloqueioDiaInteiro.motivo}` : ' (indisponível)'}
        </div>
      )}

      {bloqueiosParciais.map((bloqueio) => (
        <div
          key={bloqueio.id}
          className="mb-2 flex items-center gap-2 rounded-lg border border-[#D99120]/40 bg-[#D99120]/10 px-3 py-2 text-sm text-[#D99120]"
        >
          <Lock className="size-4" />
          Bloqueado {bloqueio.horaInicio}–{bloqueio.horaFim}
          {bloqueio.motivo ? ` — ${bloqueio.motivo}` : ''}
        </div>
      ))}

      {agendamentos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
          <Button size="sm" variant="outline" onClick={onNovo}>
            <Plus className="size-4" />
            Novo agendamento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {agendamentos.map((agendamento) => (
            <CartaoAgendamento key={agendamento.id} agendamento={agendamento} onClick={() => onEditar(agendamento)} />
          ))}
        </div>
      )}
    </div>
  )
}

function VisaoSemana({
  dataReferencia,
  hoje,
  agendamentosPorDia,
  bloqueiosPorDia,
  onEditar,
  onNovo,
  onAbrirDia,
}: {
  dataReferencia: string
  hoje: string
  agendamentosPorDia: Map<string, Agendamento[]>
  bloqueiosPorDia: Map<string, Bloqueio[]>
  onEditar: (agendamento: Agendamento) => void
  onNovo: (data: string) => void
  onAbrirDia: (data: string) => void
}) {
  const inicio = inicioDaSemana(dataReferencia)
  const dias = Array.from({ length: 7 }, (_, i) => addDias(inicio, i))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {dias.map((data, indice) => {
        const agendamentos = agendamentosPorDia.get(data) ?? []
        const bloqueios = bloqueiosPorDia.get(data) ?? []
        const bloqueioDiaInteiro = bloqueios.find((b) => b.diaInteiro)
        const ehHoje = data === hoje

        return (
          <div
            key={data}
            className={cn(
              'flex flex-col gap-2 rounded-2xl border bg-card p-3',
              ehHoje ? 'border-primary' : 'border-border',
            )}
          >
            <button
              type="button"
              onClick={() => onAbrirDia(data)}
              className="flex items-center justify-between text-left"
            >
              <span className={cn('text-sm font-medium', ehHoje ? 'text-primary' : 'text-foreground')}>
                {NOMES_DIA[indice]} · {data.slice(8, 10)}
              </span>
              {bloqueios.length > 0 && <Lock className="size-3.5 text-[#D99120]" />}
            </button>

            {bloqueioDiaInteiro ? (
              <p className="rounded-md bg-[#D99120]/10 px-2 py-1.5 text-xs text-[#D99120]">
                Bloqueado{bloqueioDiaInteiro.motivo ? `: ${bloqueioDiaInteiro.motivo}` : ''}
              </p>
            ) : (
              <>
                {agendamentos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem agendamentos</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {agendamentos.map((agendamento) => (
                      <button
                        key={agendamento.id}
                        type="button"
                        onClick={() => onEditar(agendamento)}
                        className={cn(
                          'truncate rounded-md border px-2 py-1 text-left text-xs',
                          COR_STATUS[agendamento.status],
                        )}
                      >
                        {horaBrasilia(agendamento.inicio)} {agendamento.paciente.nome}
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-auto justify-start" onClick={() => onNovo(data)}>
                  <Plus className="size-3.5" />
                  Adicionar
                </Button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VisaoMes({
  dataReferencia,
  hoje,
  agendamentosPorDia,
  bloqueiosPorDia,
  onAbrirDia,
}: {
  dataReferencia: string
  hoje: string
  agendamentosPorDia: Map<string, Agendamento[]>
  bloqueiosPorDia: Map<string, Bloqueio[]>
  onAbrirDia: (data: string) => void
}) {
  const mesAtual = dataReferencia.slice(0, 7)
  const gradeInicio = inicioDaSemana(inicioDoMes(dataReferencia))
  const semanas: string[][] = []
  let cursor = gradeInicio
  for (let semana = 0; semana < 6; semana++) {
    const dias: string[] = []
    for (let dia = 0; dia < 7; dia++) {
      dias.push(cursor)
      cursor = addDias(cursor, 1)
    }
    semanas.push(dias)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
        {NOMES_DIA.map((nome) => (
          <div key={nome} className="px-2 py-2 text-center">
            {nome}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {semanas.flat().map((data) => {
          const foraDoMes = data.slice(0, 7) !== mesAtual
          const agendamentos = agendamentosPorDia.get(data) ?? []
          const bloqueios = bloqueiosPorDia.get(data) ?? []
          const bloqueado = bloqueios.some((b) => b.diaInteiro)
          const ehHoje = data === hoje

          return (
            <button
              key={data}
              type="button"
              onClick={() => onAbrirDia(data)}
              className={cn(
                'flex min-h-24 flex-col items-start gap-1 border-b border-r border-border p-2 text-left last:border-r-0 hover:bg-muted/40',
                foraDoMes && 'bg-muted/20 text-muted-foreground',
                bloqueado && 'bg-[#D99120]/10',
              )}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                  ehHoje && 'bg-primary text-primary-foreground',
                )}
              >
                {Number(data.slice(8, 10))}
              </span>
              {bloqueado && <Lock className="size-3 text-[#D99120]" />}
              {agendamentos.length > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  {agendamentos.length} agend.
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
