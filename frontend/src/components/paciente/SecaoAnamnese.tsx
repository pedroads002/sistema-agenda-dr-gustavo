import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormularioAnamnese } from '@/components/anamnese/FormularioAnamnese'
import { listarAnamneses, formatarDataAnamnese, type Anamnese } from '@/lib/anamnese'

export function SecaoAnamnese({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['anamneses', pacienteId],
    queryFn: () => listarAnamneses(pacienteId),
  })
  const [editando, setEditando] = useState<Anamnese | null>(null)
  const [criando, setCriando] = useState(false)

  const anamneses = data?.anamneses ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['anamneses', pacienteId] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Anamnese</CardTitle>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Nova anamnese
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : anamneses.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma anamnese registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {anamneses.map((anamnese) => {
              const quantidadeSim = anamnese.perguntas.filter((p) => p.resposta).length
              return (
                <li key={anamnese.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{formatarDataAnamnese(anamnese.data)}</p>
                    <p className="text-xs text-muted-foreground">
                      {quantidadeSim === 0
                        ? 'Nenhuma resposta "Sim"'
                        : `${quantidadeSim} resposta(s) "Sim"`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditando(anamnese)}>
                    Ver / editar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <FormularioAnamnese
        aberto={criando || Boolean(editando)}
        pacienteId={pacienteId}
        anamnese={editando}
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
