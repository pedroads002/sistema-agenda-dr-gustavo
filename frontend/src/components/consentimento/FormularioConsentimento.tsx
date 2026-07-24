import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ErroApi } from '@/lib/api'
import type { Procedimento } from '@/lib/procedimentos'
import {
  criarConsentimento,
  atualizarConsentimento,
  removerConsentimento,
  urlArquivoConsentimento,
  type Consentimento,
  type DadosConsentimento,
} from '@/lib/consentimentos'

const NENHUM_PROCEDIMENTO = 'nenhum'
const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp,application/pdf'

const schema = z.object({
  procedimento: z.string().trim().min(1, 'Informe o procedimento'),
  data: z.string().min(1, 'Informe a data'),
})

type FormConsentimento = z.infer<typeof schema>

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function FormularioConsentimento({
  aberto,
  onOpenChange,
  pacienteId,
  consentimento,
  procedimentos,
  onSalvo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  pacienteId: string
  consentimento: Consentimento | null
  procedimentos: Procedimento[]
  onSalvo: () => void
}) {
  const editando = Boolean(consentimento)

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editando ? 'Editar consentimento' : 'Novo consentimento'}</SheetTitle>
        </SheetHeader>
        {aberto && (
          <Formulario
            key={consentimento?.id ?? 'novo'}
            pacienteId={pacienteId}
            consentimento={consentimento}
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
  pacienteId,
  consentimento,
  procedimentos,
  onSalvo,
  onFechar,
}: {
  pacienteId: string
  consentimento: Consentimento | null
  procedimentos: Procedimento[]
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = Boolean(consentimento)
  const [procedimentoCatalogo, setProcedimentoCatalogo] = useState(NENHUM_PROCEDIMENTO)
  const [assinado, setAssinado] = useState(consentimento?.assinado ?? false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormConsentimento>({
    resolver: zodResolver(schema),
    defaultValues: {
      procedimento: consentimento?.procedimento ?? '',
      data: consentimento?.data.slice(0, 10) ?? hoje(),
    },
  })

  function aoEscolherProcedimento(id: string) {
    setProcedimentoCatalogo(id)
    const encontrado = procedimentos.find((p) => p.id === id)
    if (encontrado) setValue('procedimento', encontrado.nome)
  }

  async function aoEnviar(dados: FormConsentimento) {
    setErroGeral(null)
    const payload: DadosConsentimento = {
      pacienteId,
      procedimento: dados.procedimento,
      data: dados.data,
      assinado,
      arquivo: arquivo ?? undefined,
    }

    try {
      if (editando) await atualizarConsentimento(consentimento!.id, payload)
      else await criarConsentimento(payload)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o consentimento.')
    }
  }

  async function aoExcluir() {
    if (!consentimento) return
    if (!window.confirm('Excluir este consentimento? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await removerConsentimento(consentimento.id)
      onSalvo()
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível excluir o consentimento.')
      setExcluindo(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="flex flex-1 flex-col gap-4 px-4" noValidate>
      <div className="space-y-1.5">
        <Label>Procedimento do catálogo</Label>
        <Select value={procedimentoCatalogo} onValueChange={aoEscolherProcedimento}>
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="procedimento">Procedimento</Label>
        <Input id="procedimento" {...register('procedimento')} />
        {errors.procedimento && <p className="text-xs text-destructive">{errors.procedimento.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register('data')} />
          {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Assinado</Label>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setAssinado(false)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                !assinado ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => setAssinado(true)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                assinado ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sim
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="arquivo">Anexo do termo assinado (PDF ou imagem)</Label>
        <input
          id="arquivo"
          type="file"
          accept={TIPOS_ACEITOS}
          onChange={(evento) => setArquivo(evento.target.files?.[0] ?? null)}
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
        {editando && consentimento?.temArquivo && !arquivo && (
          <a
            href={urlArquivoConsentimento(consentimento.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Paperclip className="size-3" />
            Ver anexo atual
          </a>
        )}
      </div>

      {erroGeral && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>}

      <SheetFooter className="mt-auto px-0 pb-4">
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : 'Salvar consentimento'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
        {editando && (
          <Button type="button" variant="destructive" onClick={aoExcluir} disabled={excluindo}>
            <Trash2 className="size-4" />
            {excluindo ? 'Excluindo...' : 'Excluir consentimento'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
