import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function SecaoOrcamentos({ pacienteId, pacienteNome }: { pacienteId: string; pacienteNome: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['orcamentos', 'paciente', pacienteId],
    queryFn: () => listarOrcamentos(undefined, pacienteId),
  })
  const { data: dadosProcedimentos } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => listarProcedimentos(),
  })
  const [editando, setEditando] = useState<Orcamento | null>(null)
  const [criando, setCriando] = useState(false)

  const orcamentos = data?.orcamentos ?? []
  const procedimentos = dadosProcedimentos?.procedimentos ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Orçamentos</CardTitle>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo orçamento
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : orcamentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum orçamento cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {orcamentos.map((orcamento) => {
              const { total } = calcularTotais(orcamento.itens, orcamento.desconto)
              return (
                <li key={orcamento.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{formatarMoeda(total)}</p>
                      <Badge variant="outline" className={cn('border', COR_STATUS_ORCAMENTO[orcamento.status])}>
                        {LABEL_STATUS_ORCAMENTO[orcamento.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatarDataOrcamento(orcamento.data)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Ver orçamento" asChild>
                      <Link to={`/orcamentos/${orcamento.id}`}>
                        <Eye className="size-4" />
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
      </CardContent>

      <FormularioOrcamento
        aberto={criando || Boolean(editando)}
        orcamento={editando}
        pacienteFixo={{ id: pacienteId, nome: pacienteNome, telefone: null, origem: null }}
        procedimentos={procedimentos}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setEditando(null)
            setCriando(false)
          }
        }}
        onSalvo={aoSalvar}
      />
    </Card>
  )
}
