import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import {
  listarProcedimentos,
  criarProcedimento,
  atualizarProcedimento,
  CATEGORIAS_PROCEDIMENTO,
  LABEL_CATEGORIA,
  type Procedimento,
  type DadosProcedimento,
} from '@/lib/procedimentos'

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do procedimento'),
  categoria: z.enum(CATEGORIAS_PROCEDIMENTO),
  valorBase: z.number('Informe um valor').min(0, 'Valor não pode ser negativo'),
  duracaoMin: z.number('Informe a duração').int().min(1, 'Duração deve ser de ao menos 1 minuto'),
  ordem: z.number('Informe a ordem').int(),
})

type FormProcedimento = z.infer<typeof schema>

export function Procedimentos() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['procedimentos', 'todos'],
    queryFn: () => listarProcedimentos(true),
  })
  const [editando, setEditando] = useState<Procedimento | null>(null)
  const [criando, setCriando] = useState(false)

  const procedimentos = data?.procedimentos ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['procedimentos'] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Procedimentos</h1>
          <p className="text-sm text-muted-foreground">Catálogo de serviços, preços e duração</p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo procedimento
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : procedimentos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum procedimento cadastrado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {procedimentos.map((procedimento) => (
              <li key={procedimento.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{procedimento.nome}</p>
                    {!procedimento.ativo && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {LABEL_CATEGORIA[procedimento.categoria as keyof typeof LABEL_CATEGORIA] ?? procedimento.categoria}
                    {' · '}
                    {procedimento.valorBase > 0 ? formatarMoeda(procedimento.valorBase) : 'Valor a definir'}
                    {' · '}
                    {procedimento.duracaoMin} min
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditando(procedimento)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormularioProcedimento
        key={editando?.id ?? (criando ? 'novo' : 'fechado')}
        aberto={criando || Boolean(editando)}
        procedimento={editando}
        proximaOrdem={procedimentos.length + 1}
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

function FormularioProcedimento({
  aberto,
  procedimento,
  proximaOrdem,
  onOpenChange,
  onSalvo,
}: {
  aberto: boolean
  procedimento: Procedimento | null
  proximaOrdem: number
  onOpenChange: (aberto: boolean) => void
  onSalvo: () => void
}) {
  const editando = Boolean(procedimento)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(procedimento?.ativo ?? true)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormProcedimento>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: procedimento?.nome ?? '',
      categoria: (procedimento?.categoria as FormProcedimento['categoria']) ?? 'facial',
      valorBase: procedimento?.valorBase ?? 0,
      duracaoMin: procedimento?.duracaoMin ?? 60,
      ordem: procedimento?.ordem ?? proximaOrdem,
    },
  })

  async function aoEnviar(dados: FormProcedimento) {
    setErroGeral(null)
    const payload: DadosProcedimento = { ...dados, ativo }
    try {
      if (editando) await atualizarProcedimento(procedimento!.id, payload)
      else await criarProcedimento(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o procedimento.')
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar procedimento' : 'Novo procedimento'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROCEDIMENTO.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {LABEL_CATEGORIA[categoria]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valorBase">Preço (R$)</Label>
              <Input
                id="valorBase"
                type="number"
                step="0.01"
                min="0"
                {...register('valorBase', { valueAsNumber: true })}
              />
              {errors.valorBase && <p className="text-xs text-destructive">{errors.valorBase.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracaoMin">Duração (min)</Label>
              <Input
                id="duracaoMin"
                type="number"
                step="1"
                min="1"
                {...register('duracaoMin', { valueAsNumber: true })}
              />
              {errors.duracaoMin && <p className="text-xs text-destructive">{errors.duracaoMin.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ordem">Ordem de exibição</Label>
            <Input id="ordem" type="number" step="1" {...register('ordem', { valueAsNumber: true })} />
            <p className="text-xs text-muted-foreground">Menor número aparece primeiro na lista.</p>
          </div>
          {editando && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={ativo} onChange={(evento) => setAtivo(evento.target.checked)} />
              Procedimento ativo (aparece na agenda e no prontuário)
            </label>
          )}
          {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}
          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar procedimento'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
