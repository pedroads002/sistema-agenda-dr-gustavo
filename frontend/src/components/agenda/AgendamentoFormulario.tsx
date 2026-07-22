import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ErroApi } from '@/lib/api'
import { BuscaPaciente, type PacienteResumo } from '@/components/agenda/BuscaPaciente'
import type { Local } from '@/lib/locais'
import type { Procedimento } from '@/lib/procedimentos'
import {
  STATUS_AGENDAMENTO,
  LABEL_STATUS,
  criarAgendamento,
  atualizarAgendamento,
  removerAgendamento,
  dataBrasilia,
  horaBrasilia,
  somarMinutos,
  linkWhatsappConfirmacao,
  type Agendamento,
  type DadosAgendamento,
  type StatusAgendamento,
} from '@/lib/agendamentos'

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const schema = z
  .object({
    localId: z.string(),
    data: z.string().min(1, 'Informe a data'),
    horaInicio: z.string().regex(HORA_REGEX, 'Hora de início inválida'),
    horaFim: z.string().regex(HORA_REGEX, 'Hora de fim inválida'),
    procedimentoNome: z.string(),
    status: z.enum(STATUS_AGENDAMENTO),
    descricao: z.string(),
  })
  .superRefine((dados, ctx) => {
    if (dados.horaFim <= dados.horaInicio) {
      ctx.addIssue({ code: 'custom', message: 'A hora de fim deve ser depois da hora de início', path: ['horaFim'] })
    }
  })

type FormAgendamento = z.infer<typeof schema>

export function AgendamentoFormulario({
  aberto,
  onOpenChange,
  agendamento,
  dataInicial,
  locais,
  procedimentos,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  agendamento: Agendamento | null
  dataInicial?: string
  locais: Local[]
  procedimentos: Procedimento[]
  onSalvo: () => void
}) {
  const editando = Boolean(agendamento)

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar agendamento' : 'Novo agendamento'}</SheetTitle>
          <SheetDescription>
            {editando ? 'Atualize os dados do agendamento.' : 'Preencha os dados do agendamento.'}
          </SheetDescription>
        </SheetHeader>
        {aberto && (
          <Formulario
            key={agendamento?.id ?? `novo-${dataInicial ?? ''}`}
            agendamento={agendamento}
            dataInicial={dataInicial}
            locais={locais}
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
  agendamento,
  dataInicial,
  locais,
  procedimentos,
  onSalvo,
  onFechar,
}: {
  agendamento: Agendamento | null
  dataInicial?: string
  locais: Local[]
  procedimentos: Procedimento[]
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = Boolean(agendamento)
  const [paciente, setPaciente] = useState<PacienteResumo | null>(
    agendamento
      ? {
          id: agendamento.paciente.id,
          nome: agendamento.paciente.nome,
          telefone: agendamento.paciente.telefone,
          origem: agendamento.paciente.origem,
        }
      : null,
  )
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [horaFimAuto, setHoraFimAuto] = useState(true)
  const [excluindo, setExcluindo] = useState(false)

  const valoresIniciais: FormAgendamento = agendamento
    ? {
        localId: agendamento.localId ?? '',
        data: dataBrasilia(agendamento.inicio),
        horaInicio: horaBrasilia(agendamento.inicio),
        horaFim: agendamento.fim ? horaBrasilia(agendamento.fim) : '',
        procedimentoNome: agendamento.procedimentoNome ?? '',
        status: agendamento.status,
        descricao: agendamento.descricao ?? '',
      }
    : {
        localId: '',
        data: dataInicial ?? '',
        horaInicio: '',
        horaFim: '',
        procedimentoNome: '',
        status: 'a_confirmar',
        descricao: '',
      }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormAgendamento>({ resolver: zodResolver(schema), defaultValues: valoresIniciais })

  const horaInicio = watch('horaInicio')

  function aoMudarProcedimento(nome: string, onChange: (valor: string) => void) {
    onChange(nome)
    if (horaFimAuto && horaInicio) {
      const procedimento = procedimentos.find((p) => p.nome === nome)
      if (procedimento) setValue('horaFim', somarMinutos(horaInicio, procedimento.duracaoMin))
    }
  }

  async function aoEnviar(dados: FormAgendamento) {
    setErroGeral(null)
    if (!paciente) {
      setErroGeral('Selecione o paciente.')
      return
    }

    const payload: DadosAgendamento = {
      pacienteId: paciente.id,
      localId: dados.localId || undefined,
      data: dados.data,
      horaInicio: dados.horaInicio,
      horaFim: dados.horaFim,
      procedimentoNome: dados.procedimentoNome || undefined,
      descricao: dados.descricao || undefined,
      status: dados.status,
    }

    async function salvar(forcarConflito: boolean) {
      const dadosFinais = { ...payload, forcarConflito }
      return editando ? atualizarAgendamento(agendamento!.id, dadosFinais) : criarAgendamento(dadosFinais)
    }

    try {
      await salvar(false)
      onSalvo()
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 409 && erro.tipo === 'conflito') {
        const confirmar = window.confirm(`${erro.message}\n\nDeseja continuar mesmo assim, sobrepondo o horário?`)
        if (!confirmar) return
        try {
          await salvar(true)
          onSalvo()
        } catch (erro2) {
          setErroGeral(erro2 instanceof ErroApi ? erro2.message : 'Não foi possível salvar o agendamento.')
        }
        return
      }
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o agendamento.')
    }
  }

  async function aoExcluir() {
    if (!agendamento) return
    if (!window.confirm('Excluir este agendamento? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await removerAgendamento(agendamento.id)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível excluir o agendamento.')
      setExcluindo(false)
    }
  }

  const whats = paciente
    ? linkWhatsappConfirmacao(paciente.telefone, paciente.nome, watch('data'), watch('horaInicio'))
    : null

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" noValidate>
      <div className="space-y-1.5">
        <Label>Paciente</Label>
        <BuscaPaciente value={paciente} onChange={setPaciente} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register('data')} />
          {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="local">Local</Label>
          <Controller
            control={control}
            name="localId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="local" className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {locais.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.nome} ({local.cidade}/{local.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="horaInicio">Hora início</Label>
          <Input id="horaInicio" type="time" {...register('horaInicio')} />
          {errors.horaInicio && <p className="text-xs text-destructive">{errors.horaInicio.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="horaFim">Hora fim</Label>
          <Input
            id="horaFim"
            type="time"
            {...register('horaFim')}
            onChange={(evento) => {
              setHoraFimAuto(false)
              register('horaFim').onChange(evento)
            }}
          />
          {errors.horaFim && <p className="text-xs text-destructive">{errors.horaFim.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="procedimento">Procedimento</Label>
        <Controller
          control={control}
          name="procedimentoNome"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(valor) => aoMudarProcedimento(valor, field.onChange)}>
              <SelectTrigger id="procedimento" className="w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {procedimentos.map((procedimento) => (
                  <SelectItem key={procedimento.id} value={procedimento.nome}>
                    {procedimento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(valor) => field.onChange(valor as StatusAgendamento)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_AGENDAMENTO.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LABEL_STATUS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" rows={3} {...register('descricao')} placeholder="Observações gerais deste agendamento" />
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0">
        {whats && (
          <Button type="button" variant="secondary" asChild>
            <a href={whats} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              Confirmar por WhatsApp
            </a>
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
        {editando && (
          <Button type="button" variant="destructive" onClick={aoExcluir} disabled={excluindo}>
            <Trash2 className="size-4" />
            {excluindo ? 'Excluindo...' : 'Excluir agendamento'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
