import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import { BuscaPaciente, type PacienteResumo } from '@/components/agenda/BuscaPaciente'
import { listarOrcamentos, calcularTotais, LABEL_STATUS_ORCAMENTO, type StatusOrcamento } from '@/lib/orcamentos'
import {
  FORMAS_PAGAMENTO,
  criarPagamento,
  atualizarPagamento,
  removerPagamento,
  type Pagamento,
  type DadosPagamento,
} from '@/lib/pagamentos'

const NENHUM_ORCAMENTO = 'nenhum'

const schema = z.object({
  orcamentoId: z.string(),
  data: z.string().min(1, 'Informe a data'),
  valor: z.number('Informe o valor').positive('Valor deve ser maior que zero'),
  forma: z.enum(FORMAS_PAGAMENTO),
  referencia: z.string(),
})

type FormPagamento = z.infer<typeof schema>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioPagamento({
  aberto,
  onOpenChange,
  pagamento,
  pacienteFixo,
  orcamentoFixoId,
  valorInicial,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  pagamento: Pagamento | null
  pacienteFixo?: PacienteResumo | null
  orcamentoFixoId?: string
  valorInicial?: number
  onSalvo: () => void
}) {
  const editando = Boolean(pagamento)

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar pagamento' : 'Novo pagamento'}</SheetTitle>
        </SheetHeader>
        {aberto && (
          <Formulario
            key={pagamento?.id ?? 'novo'}
            pagamento={pagamento}
            pacienteFixo={pacienteFixo ?? null}
            orcamentoFixoId={orcamentoFixoId}
            valorInicial={valorInicial}
            onSalvo={onSalvo}
            onFechar={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Formulario({
  pagamento,
  pacienteFixo,
  orcamentoFixoId,
  valorInicial,
  onSalvo,
  onFechar,
}: {
  pagamento: Pagamento | null
  pacienteFixo: PacienteResumo | null
  orcamentoFixoId?: string
  valorInicial?: number
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = Boolean(pagamento)
  const [paciente, setPaciente] = useState<PacienteResumo | null>(
    pagamento
      ? { id: pagamento.paciente.id, nome: pagamento.paciente.nome, telefone: pagamento.paciente.telefone, origem: null }
      : pacienteFixo,
  )
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [orcamentos, setOrcamentos] = useState<
    { id: string; status: StatusOrcamento; total: number }[]
  >([])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormPagamento>({
    resolver: zodResolver(schema),
    defaultValues: {
      orcamentoId: pagamento?.orcamentoId ?? orcamentoFixoId ?? NENHUM_ORCAMENTO,
      data: pagamento?.data.slice(0, 10) ?? hoje(),
      valor: pagamento?.valor ?? valorInicial ?? 0,
      forma: (pagamento?.forma as FormPagamento['forma']) ?? 'Pix',
      referencia: pagamento?.referencia ?? '',
    },
  })

  useEffect(() => {
    if (!paciente) {
      setOrcamentos([])
      return
    }
    listarOrcamentos(undefined, paciente.id).then((resposta) => {
      setOrcamentos(
        resposta.orcamentos.map((orcamento) => ({
          id: orcamento.id,
          status: orcamento.status,
          total: calcularTotais(orcamento.itens, orcamento.desconto).total,
        })),
      )
    })
  }, [paciente])

  async function aoEnviar(dados: FormPagamento) {
    setErroGeral(null)
    if (!paciente) {
      setErroGeral('Selecione o paciente.')
      return
    }

    const payload: DadosPagamento = {
      pacienteId: paciente.id,
      orcamentoId: dados.orcamentoId === NENHUM_ORCAMENTO ? undefined : dados.orcamentoId,
      data: dados.data,
      valor: dados.valor,
      forma: dados.forma,
      referencia: dados.referencia || undefined,
    }

    try {
      if (editando) await atualizarPagamento(pagamento!.id, payload)
      else await criarPagamento(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o pagamento.')
    }
  }

  async function aoExcluir() {
    if (!pagamento) return
    if (!window.confirm('Excluir este pagamento? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await removerPagamento(pagamento.id)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível excluir o pagamento.')
      setExcluindo(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
      <div className="space-y-1.5">
        <Label>Paciente</Label>
        {pacienteFixo ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
            {pacienteFixo.nome}
          </div>
        ) : (
          <BuscaPaciente
            value={paciente}
            onChange={(novoPaciente) => {
              setPaciente(novoPaciente)
              setValue('orcamentoId', NENHUM_ORCAMENTO)
            }}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Orçamento vinculado (opcional)</Label>
        <Controller
          control={control}
          name="orcamentoId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(orcamentoFixoId) || !paciente}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM_ORCAMENTO}>Nenhum (pagamento avulso)</SelectItem>
                {orcamentos.map((orcamento) => (
                  <SelectItem key={orcamento.id} value={orcamento.id}>
                    {formatarMoeda(orcamento.total)} · {LABEL_STATUS_ORCAMENTO[orcamento.status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {!paciente && <p className="text-xs text-muted-foreground">Selecione o paciente para ver os orçamentos dele.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input id="valor" type="number" step="0.01" min="0.01" {...register('valor', { valueAsNumber: true })} />
          {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register('data')} />
          {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Forma de pagamento</Label>
        <Controller
          control={control}
          name="forma"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referencia">Referência (opcional)</Label>
        <Input id="referencia" placeholder="ex.: parcela 1 de 3" {...register('referencia')} />
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0 pb-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Salvar pagamento'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
        {editando && (
          <Button type="button" variant="destructive" onClick={aoExcluir} disabled={excluindo}>
            <Trash2 className="size-4" />
            {excluindo ? 'Excluindo...' : 'Excluir pagamento'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
