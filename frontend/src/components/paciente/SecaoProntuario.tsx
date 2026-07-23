import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { listarProcedimentos } from '@/lib/procedimentos'
import { listarAgendamentosDoPaciente, dataBrasilia, horaBrasilia, LABEL_STATUS } from '@/lib/agendamentos'
import {
  listarProntuario,
  criarRegistroProntuario,
  atualizarRegistroProntuario,
  removerRegistroProntuario,
  type RegistroProntuario,
} from '@/lib/prontuario'

const SEM_AGENDAMENTO = 'nenhum'

const produtoSchema = z.object({
  produto: z.string().trim(),
  lote: z.string().trim(),
  validade: z.string().trim(),
  quantidade: z.string().trim(),
  regiao: z.string().trim(),
})

const schema = z.object({
  data: z.string().min(1, 'Informe a data'),
  procedimento: z.string().min(1, 'Selecione o procedimento'),
  agendamentoId: z.string(),
  observacoes: z.string().trim(),
  produtos: z.array(produtoSchema),
})

type FormProntuario = z.infer<typeof schema>

function formatarDataRegistro(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}

export function SecaoProntuario({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['prontuario', pacienteId],
    queryFn: () => listarProntuario(pacienteId),
  })
  const [editando, setEditando] = useState<RegistroProntuario | null>(null)
  const [criando, setCriando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const registros = data?.registros ?? []

  async function aoExcluir(id: string) {
    if (!window.confirm('Excluir este registro do prontuário? Essa ação não pode ser desfeita.')) return
    setExcluindoId(id)
    try {
      await removerRegistroProntuario(pacienteId, id)
      queryClient.invalidateQueries({ queryKey: ['prontuario', pacienteId] })
    } finally {
      setExcluindoId(null)
    }
  }

  function aoSalvar() {
    queryClient.invalidateQueries({ queryKey: ['prontuario', pacienteId] })
    setEditando(null)
    setCriando(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Procedimentos realizados</CardTitle>
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="size-4" />
          Registrar procedimento
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : registros.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum procedimento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {registros.map((registro) => (
              <li key={registro.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{registro.procedimento}</p>
                  <p className="text-xs text-muted-foreground">{formatarDataRegistro(registro.data)}</p>
                  {registro.produtos.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {registro.produtos
                        .map((p) => [p.produto, p.quantidade].filter(Boolean).join(' '))
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {registro.observacoes && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{registro.observacoes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Editar registro" onClick={() => setEditando(registro)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Excluir registro"
                    onClick={() => aoExcluir(registro.id)}
                    disabled={excluindoId === registro.id}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <FormularioProntuario
        key={editando?.id ?? (criando ? 'novo' : 'fechado')}
        aberto={criando || Boolean(editando)}
        pacienteId={pacienteId}
        registro={editando}
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

function FormularioProntuario({
  aberto,
  pacienteId,
  registro,
  onOpenChange,
  onSalvo,
}: {
  aberto: boolean
  pacienteId: string
  registro: RegistroProntuario | null
  onOpenChange: (aberto: boolean) => void
  onSalvo: () => void
}) {
  const editando = Boolean(registro)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const { data: dadosProcedimentos } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => listarProcedimentos(),
  })
  const { data: dadosAgendamentos } = useQuery({
    queryKey: ['agendamentos', 'paciente', pacienteId],
    queryFn: () => listarAgendamentosDoPaciente(pacienteId),
    enabled: aberto,
  })

  const procedimentos = dadosProcedimentos?.procedimentos ?? []
  const agendamentos = dadosAgendamentos?.agendamentos ?? []

  const {
    register: registrar,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormProntuario>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: registro?.data.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      procedimento: registro?.procedimento ?? '',
      agendamentoId: registro?.agendamentoId ?? SEM_AGENDAMENTO,
      observacoes: registro?.observacoes ?? '',
      produtos: registro?.produtos.map((p) => ({
        produto: p.produto ?? '',
        lote: p.lote ?? '',
        validade: p.validade ? p.validade.slice(0, 10) : '',
        quantidade: p.quantidade ?? '',
        regiao: p.regiao ?? '',
      })) ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'produtos' })

  async function aoEnviar(dados: FormProntuario) {
    setErroGeral(null)
    const payload = {
      data: dados.data,
      procedimento: dados.procedimento,
      agendamentoId: dados.agendamentoId === SEM_AGENDAMENTO ? undefined : dados.agendamentoId,
      observacoes: dados.observacoes || undefined,
      produtos: dados.produtos
        .filter((p) => p.produto || p.lote || p.validade || p.quantidade || p.regiao)
        .map((p) => ({
          produto: p.produto || undefined,
          lote: p.lote || undefined,
          validade: p.validade || undefined,
          quantidade: p.quantidade || undefined,
          regiao: p.regiao || undefined,
        })),
    }
    try {
      if (editando) await atualizarRegistroProntuario(pacienteId, registro!.id, payload)
      else await criarRegistroProntuario(pacienteId, payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o registro.')
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar procedimento realizado' : 'Registrar procedimento'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...registrar('data')} />
              {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Procedimento</Label>
              <Controller
                control={control}
                name="procedimento"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedimentos.map((p) => (
                        <SelectItem key={p.id} value={p.nome}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.procedimento && <p className="text-xs text-destructive">{errors.procedimento.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Vincular a um agendamento (opcional)</Label>
            <Controller
              control={control}
              name="agendamentoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_AGENDAMENTO}>Nenhum</SelectItem>
                    {agendamentos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {dataBrasilia(a.inicio)} às {horaBrasilia(a.inicio)} — {LABEL_STATUS[a.status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Produtos aplicados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ produto: '', lote: '', validade: '', quantidade: '', regiao: '' })}
              >
                <Plus className="size-4" />
                Adicionar produto
              </Button>
            </div>
            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum produto adicionado. Todos os campos são opcionais.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Região</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input {...registrar(`produtos.${index}.produto`)} placeholder="ex.: Ácido hialurônico" />
                        </TableCell>
                        <TableCell>
                          <Input {...registrar(`produtos.${index}.lote`)} className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Input type="date" {...registrar(`produtos.${index}.validade`)} className="w-36" />
                        </TableCell>
                        <TableCell>
                          <Input {...registrar(`produtos.${index}.quantidade`)} placeholder="ex.: 2 ml" className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Input {...registrar(`produtos.${index}.regiao`)} className="w-28" />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remover produto"
                            onClick={() => remove(index)}
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações clínicas</Label>
            <Textarea
              id="observacoes"
              rows={4}
              placeholder="Anotações livres, intercorrências, orientações..."
              {...registrar('observacoes')}
            />
          </div>

          {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

          <SheetFooter className="mt-auto px-0 pb-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar registro'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
