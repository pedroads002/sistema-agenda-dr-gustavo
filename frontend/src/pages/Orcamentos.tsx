import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatarMoeda } from '@/lib/utils'
import { listarProcedimentos } from '@/lib/procedimentos'
import { FormularioOrcamento } from '@/components/orcamento/FormularioOrcamento'
import {
  listarOrcamentos,
  calcularTotais,
  formatarDataOrcamento,
  LABEL_STATUS_ORCAMENTO,
  COR_STATUS_ORCAMENTO,
  type Orcamento,
} from '@/lib/orcamentos'

const FILTROS = ['todos', 'pendente', 'aprovado', 'recusado'] as const

export function Orcamentos() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('todos')
  const [editando, setEditando] = useState<Orcamento | null>(null)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setCriando(true)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['orcamentos', filtro],
    queryFn: () => listarOrcamentos(filtro === 'todos' ? undefined : filtro),
  })
  const { data: dadosProcedimentos } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => listarProcedimentos(),
  })

  const orcamentos = data?.orcamentos ?? []
  const procedimentos = dadosProcedimentos?.procedimentos ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Propostas de procedimentos por paciente</p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo orçamento
        </Button>
      </div>

      <div className="mb-4 w-full sm:w-56">
        <Select value={filtro} onValueChange={(valor) => setFiltro(valor as (typeof FILTROS)[number])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : orcamentos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orcamentos.map((orcamento) => {
              const { total } = calcularTotais(orcamento.itens, orcamento.desconto)
              return (
                <li key={orcamento.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{orcamento.paciente.nome}</p>
                      <Badge variant="outline" className={cn('border', COR_STATUS_ORCAMENTO[orcamento.status])}>
                        {LABEL_STATUS_ORCAMENTO[orcamento.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatarDataOrcamento(orcamento.data)}
                      {' · '}
                      {formatarMoeda(total)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orcamentos/${orcamento.id}`}>
                        <Eye className="size-4" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditando(orcamento)}>
                      Editar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <FormularioOrcamento
        aberto={criando || Boolean(editando)}
        orcamento={editando}
        procedimentos={procedimentos}
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
