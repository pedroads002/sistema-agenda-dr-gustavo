import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErroApi } from '@/lib/api'
import { listarProntuario } from '@/lib/prontuario'
import { FormularioFoto } from '@/components/foto/FormularioFoto'
import { listarFotos, removerFoto, urlArquivoFoto, formatarDataFoto, type Foto } from '@/lib/fotos'

export function SecaoFotos({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['fotos', pacienteId],
    queryFn: () => listarFotos(pacienteId),
  })
  const { data: dadosProntuario } = useQuery({
    queryKey: ['prontuario', pacienteId],
    queryFn: () => listarProntuario(pacienteId),
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const fotos = data?.fotos ?? []
  const registrosProntuario = dadosProntuario?.registros ?? []
  const antes = fotos.filter((f) => f.tipo === 'antes')
  const depois = fotos.filter((f) => f.tipo === 'depois')

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['fotos', pacienteId] })
    setEnviando(false)
  }

  async function aoExcluir(foto: Foto) {
    if (!window.confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return
    setErro(null)
    try {
      await removerFoto(foto.id)
      queryClient.invalidateQueries({ queryKey: ['fotos', pacienteId] })
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível excluir a foto.')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Fotos antes/depois</CardTitle>
        </div>
        <Button size="sm" onClick={() => setEnviando(true)}>
          <Plus className="size-4" />
          Nova foto
        </Button>
      </CardHeader>
      <CardContent>
        {erro && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : fotos.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma foto enviada ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <GaleriaColuna titulo="Antes" fotos={antes} onExcluir={aoExcluir} />
            <GaleriaColuna titulo="Depois" fotos={depois} onExcluir={aoExcluir} />
          </div>
        )}
      </CardContent>

      <FormularioFoto
        aberto={enviando}
        pacienteId={pacienteId}
        registrosProntuario={registrosProntuario}
        onOpenChange={setEnviando}
        onSalvo={aoSalvar}
      />
    </Card>
  )
}

function GaleriaColuna({
  titulo,
  fotos,
  onExcluir,
}: {
  titulo: string
  fotos: Foto[]
  onExcluir: (foto: Foto) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{titulo}</p>
      {fotos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem fotos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {fotos.map((foto) => (
            <div key={foto.id} className="group relative overflow-hidden rounded-lg border border-border">
              <a href={urlArquivoFoto(foto.id)} target="_blank" rel="noreferrer">
                <img
                  src={urlArquivoFoto(foto.id)}
                  alt={foto.descricao ?? titulo}
                  className="aspect-square w-full object-cover"
                />
              </a>
              <button
                type="button"
                onClick={() => onExcluir(foto)}
                aria-label="Excluir foto"
                className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
              <div className="bg-card/90 px-1.5 py-1 text-[11px] text-muted-foreground">
                {formatarDataFoto(foto.data)}
                {foto.descricao && ` · ${foto.descricao}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
