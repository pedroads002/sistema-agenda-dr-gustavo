import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MessageCircle,
  Calendar,
  Wallet,
  ClipboardCheck,
  Camera,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SecaoProntuario } from '@/components/paciente/SecaoProntuario'
import { SecaoOrcamentos } from '@/components/paciente/SecaoOrcamentos'
import {
  buscarPaciente,
  removerPaciente,
  formatarTelefone,
  formatarDataNascimento,
  formatarDataHora,
  linkWhatsapp,
  LABEL_SEXO,
  LABEL_ORIGEM,
  type Sexo,
  type Origem,
} from '@/lib/pacientes'

type SecaoFutura = { titulo: string; icone: LucideIcon; texto: string }

const secoesFuturas: SecaoFutura[] = [
  { titulo: 'Atendimentos', icone: Calendar, texto: 'Histórico de agendamentos aparecerá aqui (Fase 3).' },
  { titulo: 'Pagamentos', icone: Wallet, texto: 'Histórico financeiro aparecerá aqui.' },
  {
    titulo: 'Anamnese e consentimentos',
    icone: ClipboardCheck,
    texto: 'Formulários de anamnese e termos assinados aparecerão aqui.',
  },
  { titulo: 'Fotos', icone: Camera, texto: 'Fotos antes/depois aparecerão aqui.' },
]

export function PacienteFicha() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => buscarPaciente(id!),
  })

  const excluir = useMutation({
    mutationFn: () => removerPaciente(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      navigate('/pacientes')
    },
  })

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>
  }

  const paciente = data?.paciente
  if (!paciente) {
    return <div className="p-8 text-sm text-muted-foreground">Paciente não encontrado.</div>
  }

  const whats = linkWhatsapp(
    paciente.telefone,
    `Olá, ${paciente.nome}! Aqui é do consultório do Dr. Gustavo Amaral.`,
  )

  function confirmarExclusao() {
    if (window.confirm(`Excluir o cadastro de ${paciente!.nome}? Essa ação não pode ser desfeita.`)) {
      excluir.mutate()
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/pacientes">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{paciente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Cadastrado em {formatarDataHora(paciente.criadoEm)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {whats && (
            <Button variant="secondary" asChild>
              <a href={whats} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={`/pacientes/${paciente.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
          <Button variant="destructive" onClick={confirmarExclusao} disabled={excluir.isPending}>
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dados do paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="CPF" valor={paciente.cpf} />
          <Campo rotulo="Telefone/WhatsApp" valor={formatarTelefone(paciente.telefone)} />
          <Campo rotulo="E-mail" valor={paciente.email} />
          <Campo rotulo="Nascimento" valor={formatarDataNascimento(paciente.nascimento)} />
          <Campo rotulo="Sexo" valor={paciente.sexo ? LABEL_SEXO[paciente.sexo as Sexo] : null} />
          <Campo
            rotulo="Cidade/UF"
            valor={[paciente.cidade, paciente.uf].filter(Boolean).join('/') || null}
          />
          <Campo rotulo="Endereço" valor={paciente.endereco} />
          <Campo rotulo="Como conheceu" valor={paciente.origem ? LABEL_ORIGEM[paciente.origem as Origem] : null} />
        </CardContent>
        {paciente.observacoes && (
          <CardContent className="pt-0">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Observações</p>
            <p className="text-sm whitespace-pre-wrap text-foreground">{paciente.observacoes}</p>
          </CardContent>
        )}
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SecaoOrcamentos pacienteId={paciente.id} pacienteNome={paciente.nome} />
        <SecaoProntuario pacienteId={paciente.id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {secoesFuturas.map((secao) => (
          <Card key={secao.titulo}>
            <CardHeader className="flex flex-row items-center gap-2">
              <secao.icone className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">{secao.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{secao.texto}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>
      <p className="text-sm text-foreground">{valor || '—'}</p>
    </div>
  )
}
