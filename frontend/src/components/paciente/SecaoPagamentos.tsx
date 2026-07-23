import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Wallet, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatarMoeda } from '@/lib/utils'
import { FormularioPagamento } from '@/components/pagamento/FormularioPagamento'
import { listarPagamentos, formatarDataPagamento, type Pagamento } from '@/lib/pagamentos'

export function SecaoPagamentos({ pacienteId, pacienteNome }: { pacienteId: string; pacienteNome: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['pagamentos', 'paciente', pacienteId],
    queryFn: () => listarPagamentos({ pacienteId }),
  })
  const [editando, setEditando] = useState<Pagamento | null>(null)
  const [criando, setCriando] = useState(false)

  const pagamentos = data?.pagamentos ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Pagamentos</CardTitle>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo pagamento
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : pagamentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum pagamento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pagamentos.map((pagamento) => (
              <li key={pagamento.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{formatarMoeda(pagamento.valor)}</p>
                    <span className="text-xs text-muted-foreground">{pagamento.forma}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatarDataPagamento(pagamento.data)}</p>
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
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <FormularioPagamento
        aberto={criando || Boolean(editando)}
        pagamento={editando}
        pacienteFixo={{ id: pacienteId, nome: pacienteNome, telefone: null, origem: null }}
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
