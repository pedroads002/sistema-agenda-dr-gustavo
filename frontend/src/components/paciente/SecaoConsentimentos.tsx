import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCheck2, Paperclip, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { listarProcedimentos } from '@/lib/procedimentos'
import { FormularioConsentimento } from '@/components/consentimento/FormularioConsentimento'
import {
  listarConsentimentos,
  formatarDataConsentimento,
  urlArquivoConsentimento,
  type Consentimento,
} from '@/lib/consentimentos'

export function SecaoConsentimentos({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['consentimentos', pacienteId],
    queryFn: () => listarConsentimentos(pacienteId),
  })
  const { data: dadosProcedimentos } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => listarProcedimentos(),
  })
  const [editando, setEditando] = useState<Consentimento | null>(null)
  const [criando, setCriando] = useState(false)

  const consentimentos = data?.consentimentos ?? []
  const procedimentos = dadosProcedimentos?.procedimentos ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['consentimentos', pacienteId] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileCheck2 className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Consentimentos</CardTitle>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo consentimento
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : consentimentos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum consentimento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {consentimentos.map((consentimento) => (
              <li key={consentimento.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{consentimento.procedimento}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border',
                        consentimento.assinado
                          ? 'border-[#3AA76D]/40 bg-[#3AA76D]/15 text-[#3AA76D]'
                          : 'border-[#D99120]/40 bg-[#D99120]/15 text-[#D99120]',
                      )}
                    >
                      {consentimento.assinado ? 'Assinado' : 'Falta assinar'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatarDataConsentimento(consentimento.data)}</p>
                  {consentimento.temArquivo && (
                    <a
                      href={urlArquivoConsentimento(consentimento.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Paperclip className="size-3" />
                      Ver anexo
                    </a>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditando(consentimento)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <FormularioConsentimento
        aberto={criando || Boolean(editando)}
        pacienteId={pacienteId}
        consentimento={editando}
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
