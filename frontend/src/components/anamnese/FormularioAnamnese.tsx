import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ErroApi } from '@/lib/api'
import {
  PERGUNTAS_PADRAO,
  criarAnamnese,
  atualizarAnamnese,
  removerAnamnese,
  type Anamnese,
  type DadosAnamnese,
} from '@/lib/anamnese'

const perguntaSchema = z.object({
  chave: z.string(),
  pergunta: z.string(),
  resposta: z.boolean(),
  detalhe: z.string(),
})

const schema = z.object({
  data: z.string().min(1, 'Informe a data'),
  perguntas: z.array(perguntaSchema),
  observacoes: z.string(),
})

type FormAnamnese = z.infer<typeof schema>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioAnamnese({
  aberto,
  onOpenChange,
  pacienteId,
  anamnese,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  pacienteId: string
  anamnese: Anamnese | null
  onSalvo: () => void
}) {
  const editando = Boolean(anamnese)

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar anamnese' : 'Nova anamnese'}</SheetTitle>
        </SheetHeader>
        {aberto && (
          <Formulario
            key={anamnese?.id ?? 'novo'}
            pacienteId={pacienteId}
            anamnese={anamnese}
            onSalvo={onSalvo}
            onFechar={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Formulario({
  pacienteId,
  anamnese,
  onSalvo,
  onFechar,
}: {
  pacienteId: string
  anamnese: Anamnese | null
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = Boolean(anamnese)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const {
    control,
    handleSubmit,
    register,
    formState: { isSubmitting },
  } = useForm<FormAnamnese>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: anamnese?.data.slice(0, 10) ?? hoje(),
      observacoes: anamnese?.observacoes ?? '',
      perguntas: anamnese
        ? anamnese.perguntas.map((p) => ({ chave: p.chave, pergunta: p.pergunta, resposta: p.resposta, detalhe: p.detalhe ?? '' }))
        : PERGUNTAS_PADRAO.map((p) => ({ chave: p.chave, pergunta: p.pergunta, resposta: false, detalhe: '' })),
    },
  })

  const { fields } = useFieldArray({ control, name: 'perguntas' })

  async function aoEnviar(dados: FormAnamnese) {
    setErroGeral(null)
    const payload: DadosAnamnese = {
      pacienteId,
      data: dados.data,
      observacoes: dados.observacoes || undefined,
      perguntas: dados.perguntas.map((p) => ({
        chave: p.chave,
        pergunta: p.pergunta,
        resposta: p.resposta,
        detalhe: p.resposta ? p.detalhe || undefined : undefined,
      })),
    }

    try {
      if (editando) await atualizarAnamnese(anamnese!.id, payload)
      else await criarAnamnese(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar a anamnese.')
    }
  }

  async function aoExcluir() {
    if (!anamnese) return
    if (!window.confirm('Excluir esta anamnese? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await removerAnamnese(anamnese.id)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível excluir a anamnese.')
      setExcluindo(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="data">Data</Label>
        <Input id="data" type="date" {...register('data')} className="max-w-48" />
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{field.pergunta}</p>
              <Controller
                control={control}
                name={`perguntas.${index}.resposta`}
                render={({ field: campo }) => <ToggleSimNao value={campo.value} onChange={campo.onChange} />}
              />
            </div>
            <Controller
              control={control}
              name={`perguntas.${index}.resposta`}
              render={({ field: campoResposta }) =>
                campoResposta.value ? (
                  <Input
                    className="mt-2"
                    placeholder="Detalhes"
                    {...register(`perguntas.${index}.detalhe`)}
                  />
                ) : (
                  <></>
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações gerais</Label>
        <Textarea id="observacoes" rows={3} {...register('observacoes')} />
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0 pb-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Salvar anamnese'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
        {editando && (
          <Button type="button" variant="destructive" onClick={aoExcluir} disabled={excluindo}>
            <Trash2 className="size-4" />
            {excluindo ? 'Excluindo...' : 'Excluir anamnese'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}

function ToggleSimNao({ value, onChange }: { value: boolean; onChange: (valor: boolean) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          !value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Não
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Sim
      </button>
    </div>
  )
}
