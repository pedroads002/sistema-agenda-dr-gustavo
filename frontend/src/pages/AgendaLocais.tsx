import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { listarLocais, criarLocal, atualizarLocal, type Local, type DadosLocal } from '@/lib/locais'

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do local'),
  cidade: z.string().trim().min(1, 'Informe a cidade'),
  uf: z.string().trim().length(2, 'UF deve ter 2 letras'),
  endereco: z.string().trim(),
})

type FormLocal = z.infer<typeof schema>

export function AgendaLocais() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['locais', 'todos'], queryFn: () => listarLocais(true) })
  const [editando, setEditando] = useState<Local | null>(null)
  const [criando, setCriando] = useState(false)

  const locais = data?.locais ?? []

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['locais'] })
    setEditando(null)
    setCriando(false)
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
          <h1 className="text-lg font-semibold text-foreground">Locais de atendimento</h1>
          <p className="text-sm text-muted-foreground">Cidades e endereços onde o Dr. Gustavo atende</p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Novo local
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : locais.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum local cadastrado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {locais.map((local) => (
              <li key={local.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{local.nome}</p>
                    {!local.ativo && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {local.cidade}/{local.uf}
                    {local.endereco ? ` · ${local.endereco}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditando(local)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormularioLocal
        key={editando?.id ?? (criando ? 'novo' : 'fechado')}
        aberto={criando || Boolean(editando)}
        local={editando}
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

function FormularioLocal({
  aberto,
  local,
  onOpenChange,
  onSalvo,
}: {
  aberto: boolean
  local: Local | null
  onOpenChange: (aberto: boolean) => void
  onSalvo: () => void
}) {
  const editando = Boolean(local)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(local?.ativo ?? true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLocal>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: local?.nome ?? '',
      cidade: local?.cidade ?? '',
      uf: local?.uf ?? '',
      endereco: local?.endereco ?? '',
    },
  })

  async function aoEnviar(dados: FormLocal) {
    setErroGeral(null)
    const payload: DadosLocal = { ...dados, ativo }
    try {
      if (editando) await atualizarLocal(local!.id, payload)
      else await criarLocal(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o local.')
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar local' : 'Novo local'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="ex.: Consultório Recife" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register('cidade')} />
              {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                maxLength={2}
                className="w-16 uppercase"
                {...register('uf')}
                onInput={(evento) => {
                  evento.currentTarget.value = evento.currentTarget.value.toUpperCase()
                }}
              />
              {errors.uf && <p className="text-xs text-destructive">{errors.uf.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register('endereco')} />
          </div>
          {editando && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={ativo} onChange={(evento) => setAtivo(evento.target.checked)} />
              Local ativo (aparece nos filtros e no cadastro de agendamentos)
            </label>
          )}
          {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}
          <SheetFooter className="mt-auto px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar local'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
