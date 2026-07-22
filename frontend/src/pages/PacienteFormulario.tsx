import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErroApi } from '@/lib/api'
import {
  SEXOS,
  ORIGENS,
  LABEL_SEXO,
  LABEL_ORIGEM,
  buscarPaciente,
  criarPaciente,
  atualizarPaciente,
  type DadosPaciente,
  type Paciente,
} from '@/lib/pacientes'

const schema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome completo'),
  cpf: z.union([
    z.literal(''),
    z.string().refine((valor) => /^\d{11}$/.test(valor.replace(/\D/g, '')), 'CPF inválido (11 números)'),
  ]),
  telefone: z.union([
    z.literal(''),
    z
      .string()
      .refine((valor) => /^\d{10,11}$/.test(valor.replace(/\D/g, '')), 'Telefone inválido (DDD + número)'),
  ]),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]),
  nascimento: z.string(),
  sexo: z.string(),
  cidade: z.string(),
  uf: z.union([z.literal(''), z.string().length(2, 'UF deve ter 2 letras')]),
  endereco: z.string(),
  origem: z.string(),
  observacoes: z.string(),
})

type FormPaciente = z.infer<typeof schema>

const valoresVazios: FormPaciente = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  nascimento: '',
  sexo: '',
  cidade: '',
  uf: '',
  endereco: '',
  origem: '',
  observacoes: '',
}

function paraValoresFormulario(paciente: Paciente): FormPaciente {
  return {
    nome: paciente.nome,
    cpf: paciente.cpf ?? '',
    telefone: paciente.telefone ?? '',
    email: paciente.email ?? '',
    nascimento: paciente.nascimento ? paciente.nascimento.slice(0, 10) : '',
    sexo: paciente.sexo ?? '',
    cidade: paciente.cidade ?? '',
    uf: paciente.uf ?? '',
    endereco: paciente.endereco ?? '',
    origem: paciente.origem ?? '',
    observacoes: paciente.observacoes ?? '',
  }
}

/** Carrega o paciente (se for edição) e só então monta o formulário — evita ter que
 * "reencaixar" valores num formulário já montado, o que causava conflito com os
 * campos de seleção (Sexo/Origem). */
export function PacienteFormulario() {
  const { id } = useParams<{ id?: string }>()
  const editando = Boolean(id)

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => buscarPaciente(id!),
    enabled: editando,
  })

  if (editando && isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>
  }

  if (editando && !data?.paciente) {
    return <div className="p-8 text-sm text-muted-foreground">Paciente não encontrado.</div>
  }

  return (
    <Formulario
      key={id ?? 'novo'}
      id={id}
      valoresIniciais={data?.paciente ? paraValoresFormulario(data.paciente) : valoresVazios}
    />
  )
}

function Formulario({ id, valoresIniciais }: { id?: string; valoresIniciais: FormPaciente }) {
  const editando = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormPaciente>({ resolver: zodResolver(schema), defaultValues: valoresIniciais })

  async function aoEnviar(dados: FormPaciente) {
    setErroGeral(null)
    const payload: DadosPaciente = dados
    try {
      const resultado = editando ? await atualizarPaciente(id!, payload) : await criarPaciente(payload)
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      navigate(`/pacientes/${resultado.paciente.id}`)
    } catch (erro) {
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o paciente.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={editando ? `/pacientes/${id}` : '/pacientes'}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <UserRound className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {editando ? 'Editar paciente' : 'Novo paciente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {editando ? 'Atualize os dados do paciente' : 'Preencha os dados do paciente'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(aoEnviar)}
        className="space-y-5 rounded-2xl border border-border bg-card p-6"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone/WhatsApp</Label>
            <Input id="telefone" placeholder="(11) 98765-4321" {...register('telefone')} />
            {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nascimento">Data de nascimento</Label>
            <Input id="nascimento" type="date" {...register('nascimento')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sexo">Sexo</Label>
            <Controller
              control={control}
              name="sexo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sexo" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEXOS.map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {LABEL_SEXO[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="origem">Como conheceu (origem)</Label>
            <Controller
              control={control}
              name="origem"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="origem" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {LABEL_ORIGEM[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" {...register('cidade')} />
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

        <div className="space-y-1.5">
          <Label htmlFor="observacoes">Observações gerais</Label>
          <Textarea id="observacoes" rows={4} {...register('observacoes')} />
        </div>

        {erroGeral && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroGeral}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar paciente'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={editando ? `/pacientes/${id}` : '/pacientes'}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
