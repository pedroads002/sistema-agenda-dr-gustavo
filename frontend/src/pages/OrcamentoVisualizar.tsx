import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Printer, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Logo } from '@/components/brand/Logo'
import { cn, formatarMoeda } from '@/lib/utils'
import { listarProcedimentos } from '@/lib/procedimentos'
import { formatarTelefone } from '@/lib/pacientes'
import { FormularioOrcamento } from '@/components/orcamento/FormularioOrcamento'
import {
  buscarOrcamento,
  calcularTotais,
  calcularSaldo,
  formatarDataOrcamento,
  linkWhatsappOrcamento,
  LABEL_STATUS_ORCAMENTO,
  COR_STATUS_ORCAMENTO,
} from '@/lib/orcamentos'

export function OrcamentoVisualizar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editando, setEditando] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['orcamento', id],
    queryFn: () => buscarOrcamento(id!),
  })
  const { data: dadosProcedimentos } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => listarProcedimentos(),
  })

  const procedimentos = dadosProcedimentos?.procedimentos ?? []

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>
  }

  const orcamento = data?.orcamento
  if (!orcamento) {
    return <div className="p-8 text-sm text-muted-foreground">Orçamento não encontrado.</div>
  }

  const { subtotal, desconto, total } = calcularTotais(orcamento.itens, orcamento.desconto)
  const { pago, saldo } = calcularSaldo(orcamento)
  const whats = linkWhatsappOrcamento(orcamento)
  const enderecoPaciente = [orcamento.paciente.cidade, orcamento.paciente.uf].filter(Boolean).join('/')

  function aoSalvarEdicao() {
    queryClient.invalidateQueries({ queryKey: ['orcamento', id] })
    queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
    setEditando(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <div className="flex flex-wrap gap-2">
          {whats && (
            <Button variant="secondary" asChild>
              <a href={whats} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                Enviar por WhatsApp
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditando(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      <div className="print-area mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <div>
              <p className="text-base font-semibold text-foreground">Dr. Gustavo Amaral</p>
              <p className="text-sm text-muted-foreground">Harmonização Estética</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Orçamento</p>
            <p className="text-sm text-muted-foreground">{formatarDataOrcamento(orcamento.data)}</p>
            <Badge variant="outline" className={cn('mt-1 border', COR_STATUS_ORCAMENTO[orcamento.status])}>
              {LABEL_STATUS_ORCAMENTO[orcamento.status]}
            </Badge>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Paciente</p>
          <p className="text-sm font-medium text-foreground">{orcamento.paciente.nome}</p>
          <p className="text-sm text-muted-foreground">
            {[formatarTelefone(orcamento.paciente.telefone), orcamento.paciente.cpf, enderecoPaciente || null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="mb-6 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamento.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(item.valorUnit)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(item.quantidade * item.valorUnit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mb-6 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Desconto</span>
            <span>{formatarMoeda(desconto)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatarMoeda(total)}</span>
          </div>
        </div>

        {orcamento.status === 'aprovado' && (
          <div className="mb-6 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Pagamentos</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Total</span>
              <span>{formatarMoeda(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Já pago</span>
              <span>{formatarMoeda(pago)}</span>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <span>Saldo</span>
              <span>{formatarMoeda(saldo)}</span>
            </div>
          </div>
        )}

        {orcamento.validoAte && (
          <p className="mb-4 text-sm text-muted-foreground">
            Válido até {formatarDataOrcamento(orcamento.validoAte)}
          </p>
        )}

        {orcamento.observacoes && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Observações</p>
            <p className="text-sm whitespace-pre-wrap text-foreground">{orcamento.observacoes}</p>
          </div>
        )}
      </div>

      <FormularioOrcamento
        aberto={editando}
        orcamento={orcamento}
        procedimentos={procedimentos}
        onOpenChange={setEditando}
        onSalvo={aoSalvarEdicao}
      />

      <p className="no-print mt-4 text-center text-xs text-muted-foreground">
        <Link to="/orcamentos" className="underline">
          Voltar para todos os orçamentos
        </Link>
      </p>
    </div>
  )
}
