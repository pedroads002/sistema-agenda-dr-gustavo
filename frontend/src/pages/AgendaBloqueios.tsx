import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import {
  listarBloqueios,
  criarBloqueio,
  removerBloqueio,
  formatarDataBloqueio,
  type DadosBloqueio,
} from '@/lib/bloqueios'

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const schema = z
  .object({
    data: z.string().min(1, 'Informe a data'),
    diaInteiro: z.boolean(),
    horaInicio: z.string(),
    horaFim: z.string(),
    motivo: z.string(),
  })
  .superRefine((dados, ctx) => {
    if (!dados.diaInteiro) {
      if (!HORA_REGEX.test(dados.horaInicio)) {
        ctx.addIssue({ code: 'custom', message: 'Informe a hora de início', path: ['horaInicio'] })
      }
      if (!HORA_REGEX.test(dados.horaFim)) {
        ctx.addIssue({ code: 'custom', message: 'Informe a hora de fim', path: ['horaFim'] })
      }
      if (HORA_REGEX.test(dados.horaInicio) && HORA_REGEX.test(dados.horaFim) && dados.horaFim <= dados.horaInicio) {
        ctx.addIssue({ code: 'custom', message: 'A hora de fim deve ser depois da hora de início', path: ['horaFim'] })
      }
    }
  })

type FormBloqueio = z.infer<typeof schema>

export function AgendaBloqueios() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['bloqueios', 'todos'], queryFn: () => listarBloqueios() })
  const [criando, setCriando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const bloqueios = data?.bloqueios ?? []

  async function aoExcluir(id: string) {
    if (!window.confirm('Excluir este bloqueio? O horário voltará a ficar disponível.')) return
    setExcluindoId(id)
    try {
      await removerBloqueio(id)
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/agenda">
          <ArrowLeft className="size-4" />
          Voltar para a agenda
        </Link>
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Bloqueios</h1>
          <p className="text-sm text-muted-foreground">Dias ou horários em que o Dr. Gustavo não atende</p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo bloqueio
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : bloqueios.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <CalendarOff className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bloqueios.map((bloqueio) => (
              <li key={bloqueio.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatarDataBloqueio(bloqueio.data)}
                    {' — '}
                    {bloqueio.diaInteiro ? 'Dia inteiro' : `${bloqueio.horaInicio}–${bloqueio.horaFim}`}
                  </p>
                  {bloqueio.motivo && <p className="text-sm text-muted-foreground">{bloqueio.motivo}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir bloqueio"
                  onClick={() => aoExcluir(bloqueio.id)}
                  disabled={excluindoId === bloqueio.id}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormularioBloqueio
        aberto={criando}
        onOpenChange={setCriando}
        onSalvo={() => {
          queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
          setCriando(false)
        }}
      />
    </div>
  )
}

function FormularioBloqueio({
  aberto,
  onOpenChange,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onSalvo: () => void
}) {
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormBloqueio>({
    resolver: zodResolver(schema),
    defaultValues: { data: '', diaInteiro: true, horaInicio: '', horaFim: '', motivo: '' },
  })

  const diaInteiro = watch('diaInteiro')

  async function aoEnviar(dados: FormBloqueio) {
    setErroGeral(null)
    const payload: DadosBloqueio = {
      data: dados.data,
      diaInteiro: dados.diaInteiro,
      horaInicio: dados.diaInteiro ? undefined : dados.horaInicio,
      horaFim: dados.diaInteiro ? undefined : dados.horaFim,
      motivo: dados.motivo || undefined,
    }
    try {
      await criarBloqueio(payload)
      reset({ data: '', diaInteiro: true, horaInicio: '', horaFim: '', motivo: '' })
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o bloqueio.')
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo bloqueio</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...register('data')} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" {...register('diaInteiro')} />
            Dia inteiro
          </label>

          {!diaInteiro && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="horaInicio">Hora início</Label>
                <Input id="horaInicio" type="time" {...register('horaInicio')} />
                {errors.horaInicio && <p className="text-xs text-destructive">{errors.horaInicio.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="horaFim">Hora fim</Label>
                <Input id="horaFim" type="time" {...register('horaFim')} />
                {errors.horaFim && <p className="text-xs text-destructive">{errors.horaFim.message}</p>}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input id="motivo" placeholder="ex.: Viagem, compromisso pessoal" {...register('motivo')} />
          </div>

          {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar bloqueio'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
