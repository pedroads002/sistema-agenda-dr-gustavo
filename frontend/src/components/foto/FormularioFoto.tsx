import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ErroApi } from '@/lib/api'
import type { RegistroProntuario } from '@/lib/prontuario'
import { TIPOS_FOTO, LABEL_TIPO_FOTO, enviarFoto, formatarDataFoto, type TipoFoto } from '@/lib/fotos'

const NENHUM_PROCEDIMENTO = 'nenhum'
const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp'

const schema = z.object({
  procedimentoRealizadoId: z.string(),
  tipo: z.enum(TIPOS_FOTO),
  descricao: z.string(),
  data: z.string().min(1, 'Informe a data'),
})

type FormFoto = z.infer<typeof schema>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioFoto({
  aberto,
  onOpenChange,
  pacienteId,
  registrosProntuario,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  pacienteId: string
  registrosProntuario: RegistroProntuario[]
  onSalvo: () => void
}) {
  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova foto</SheetTitle>
        </SheetHeader>
        {aberto && (
          <Formulario
            pacienteId={pacienteId}
            registrosProntuario={registrosProntuario}
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
  registrosProntuario,
  onSalvo,
  onFechar,
}: {
  pacienteId: string
  registrosProntuario: RegistroProntuario[]
  onSalvo: () => void
  onFechar: () => void
}) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormFoto>({
    resolver: zodResolver(schema),
    defaultValues: {
      procedimentoRealizadoId: NENHUM_PROCEDIMENTO,
      tipo: 'antes',
      descricao: '',
      data: hoje(),
    },
  })

  async function aoEnviar(dados: FormFoto) {
    setErroGeral(null)
    if (!arquivo) {
      setErroGeral('Selecione a foto para enviar.')
      return
    }

    try {
      await enviarFoto({
        pacienteId,
        procedimentoRealizadoId: dados.procedimentoRealizadoId === NENHUM_PROCEDIMENTO ? undefined : dados.procedimentoRealizadoId,
        tipo: dados.tipo,
        descricao: dados.descricao || undefined,
        data: dados.data,
        arquivo,
      })
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível enviar a foto.')
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="flex rounded-lg border border-border p-0.5">
              {TIPOS_FOTO.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => field.onChange(tipo)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    field.value === tipo
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {LABEL_TIPO_FOTO[tipo as TipoFoto]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Procedimento realizado (opcional)</Label>
        <Controller
          control={control}
          name="procedimentoRealizadoId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM_PROCEDIMENTO}>Nenhum</SelectItem>
                {registrosProntuario.map((registro) => (
                  <SelectItem key={registro.id} value={registro.id}>
                    {registro.procedimento} · {formatarDataFoto(registro.data)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data">Data</Label>
        <Input id="data" type="date" {...register('data')} />
        {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Input id="descricao" placeholder="ex.: 30 dias após aplicação" {...register('descricao')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="arquivo">Foto (JPG, PNG ou WEBP)</Label>
        <input
          id="arquivo"
          type="file"
          accept={TIPOS_ACEITOS}
          onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0 pb-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Enviando...' : 'Enviar foto'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
