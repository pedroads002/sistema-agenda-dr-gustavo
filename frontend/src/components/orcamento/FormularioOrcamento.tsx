import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import { BuscaPaciente, type PacienteResumo } from '@/components/agenda/BuscaPaciente'
import type { Procedimento } from '@/lib/procedimentos'
import {
  STATUS_ORCAMENTO,
  LABEL_STATUS_ORCAMENTO,
  criarOrcamento,
  atualizarOrcamento,
  removerOrcamento,
  calcularTotais,
  type Orcamento,
  type DadosOrcamento,
  type StatusOrcamento,
} from '@/lib/orcamentos'

const NENHUM_PROCEDIMENTO = 'nenhum'

const itemSchema = z.object({
  procedimentoId: z.string(),
  descricao: z.string().trim().min(1, 'Informe a descrição'),
  quantidade: z.number('Informe a quantidade').int().min(1, 'Mínimo 1'),
  valorUnit: z.number('Informe o valor').min(0, 'Valor não pode ser negativo'),
})

const schema = z.object({
  data: z.string().min(1, 'Informe a data'),
  validoAte: z.string(),
  status: z.enum(STATUS_ORCAMENTO),
  desconto: z.number('Informe o desconto').min(0, 'Desconto não pode ser negativo'),
  observacoes: z.string(),
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um item'),
})

type FormOrcamento = z.infer<typeof schema>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

function novoItemVazio(): FormOrcamento['itens'][number] {
  return { procedimentoId: NENHUM_PROCEDIMENTO, descricao: '', quantidade: 1, valorUnit: 0 }
}

export function FormularioOrcamento({
  aberto,
  onOpenChange,
  orcamento,
  pacienteFixo,
  procedimentos,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  orcamento: Orcamento | null
  pacienteFixo?: PacienteResumo | null
  procedimentos: Procedimento[]
  onSalvo: () => void
}) {
  const editando = Boolean(orcamento)

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar orçamento' : 'Novo orçamento'}</SheetTitle>
        </SheetHeader>
        {aberto && (
          <Formulario
            key={orcamento?.id ?? 'novo'}
            orcamento={orcamento}
            pacienteFixo={pacienteFixo ?? null}
            procedimentos={procedimentos}
            onSalvo={onSalvo}
            onFechar={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Formulario({
  orcamento,
  pacienteFixo,
  procedimentos,
  onSalvo,
  onFechar,
}: {
  orcamento: Orcamento | null
  pacienteFixo: PacienteResumo | null
  procedimentos: Procedimento[]
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = Boolean(orcamento)
  const [paciente, setPaciente] = useState<PacienteResumo | null>(
    orcamento
      ? { id: orcamento.paciente.id, nome: orcamento.paciente.nome, telefone: orcamento.paciente.telefone, origem: null }
      : pacienteFixo,
  )
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormOrcamento>({
    resolver: zodResolver(schema),
    defaultValues: {
      data: orcamento?.data.slice(0, 10) ?? hoje(),
      validoAte: orcamento?.validoAte?.slice(0, 10) ?? '',
      status: orcamento?.status ?? 'pendente',
      desconto: orcamento?.desconto ?? 0,
      observacoes: orcamento?.observacoes ?? '',
      itens: orcamento
        ? orcamento.itens.map((item) => ({
            procedimentoId: NENHUM_PROCEDIMENTO,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
          }))
        : [novoItemVazio()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const itensAtuais = watch('itens')
  const desconto = watch('desconto') || 0
  const totais = calcularTotais(itensAtuais ?? [], desconto)

  function aoEscolherProcedimento(index: number, procedimentoId: string) {
    setValue(`itens.${index}.procedimentoId`, procedimentoId)
    const procedimento = procedimentos.find((p) => p.id === procedimentoId)
    if (procedimento) {
      setValue(`itens.${index}.descricao`, procedimento.nome)
      setValue(`itens.${index}.valorUnit`, procedimento.valorBase)
    }
  }

  async function aoEnviar(dados: FormOrcamento) {
    setErroGeral(null)
    if (!paciente) {
      setErroGeral('Selecione o paciente.')
      return
    }

    const payload: DadosOrcamento = {
      pacienteId: paciente.id,
      data: dados.data,
      validoAte: dados.validoAte || undefined,
      status: dados.status,
      desconto: dados.desconto,
      observacoes: dados.observacoes || undefined,
      itens: dados.itens.map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnit: item.valorUnit,
      })),
    }

    try {
      if (editando) await atualizarOrcamento(orcamento!.id, payload)
      else await criarOrcamento(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o orçamento.')
    }
  }

  async function aoExcluir() {
    if (!orcamento) return
    if (!window.confirm('Excluir este orçamento? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await removerOrcamento(orcamento.id)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível excluir o orçamento.')
      setExcluindo(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" noValidate>
      <div className="space-y-1.5">
        <Label>Paciente</Label>
        {pacienteFixo ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
            {pacienteFixo.nome}
          </div>
        ) : (
          <BuscaPaciente value={paciente} onChange={setPaciente} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register('data')} />
          {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="validoAte">Válido até (opcional)</Label>
          <Input id="validoAte" type="date" {...register('validoAte')} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens do orçamento</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append(novoItemVazio())}>
            <Plus className="size-4" />
            Adicionar item
          </Button>
        </div>
        {errors.itens?.message && <p className="text-xs text-destructive">{errors.itens.message}</p>}
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-40">Procedimento do catálogo</TableHead>
                <TableHead className="min-w-40">Descrição</TableHead>
                <TableHead className="w-20">Qtd.</TableHead>
                <TableHead className="w-28">Valor unit.</TableHead>
                <TableHead className="w-28">Subtotal</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const item = itensAtuais?.[index]
                const subtotalItem = (item?.quantidade || 0) * (item?.valorUnit || 0)
                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`itens.${index}.procedimentoId`}
                        render={({ field: campoProcedimento }) => (
                          <Select
                            value={campoProcedimento.value}
                            onValueChange={(valor) => aoEscolherProcedimento(index, valor)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Personalizado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NENHUM_PROCEDIMENTO}>Personalizado</SelectItem>
                              {procedimentos.map((procedimento) => (
                                <SelectItem key={procedimento.id} value={procedimento.id}>
                                  {procedimento.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`itens.${index}.descricao`)} placeholder="ex.: Harmonização facial" />
                      {errors.itens?.[index]?.descricao && (
                        <p className="text-xs text-destructive">{errors.itens[index]?.descricao?.message}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        className="w-20"
                        {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-28"
                        {...register(`itens.${index}.valorUnit`, { valueAsNumber: true })}
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-foreground">
                      {formatarMoeda(subtotalItem)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remover item"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <X className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="desconto">Desconto (R$)</Label>
          <Input
            id="desconto"
            type="number"
            step="0.01"
            min="0"
            {...register('desconto', { valueAsNumber: true })}
          />
          {errors.desconto && <p className="text-xs text-destructive">{errors.desconto.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(valor) => field.onChange(valor as StatusOrcamento)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORCAMENTO.map((status) => (
                    <SelectItem key={status} value={status}>
                      {LABEL_STATUS_ORCAMENTO[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatarMoeda(totais.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Desconto</span>
          <span>{formatarMoeda(totais.desconto)}</span>
        </div>
        <div className="flex justify-between font-medium text-foreground">
          <span>Total</span>
          <span>{formatarMoeda(totais.total)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações (condições de pagamento etc.)</Label>
        <Textarea id="observacoes" rows={3} {...register('observacoes')} />
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0 pb-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Salvar orçamento'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
        {editando && (
          <Button type="button" variant="destructive" onClick={aoExcluir} disabled={excluindo}>
            <Trash2 className="size-4" />
            {excluindo ? 'Excluindo...' : 'Excluir orçamento'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
