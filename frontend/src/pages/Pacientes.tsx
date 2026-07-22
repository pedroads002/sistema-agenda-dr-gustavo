import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, MessageCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { listarPacientes, formatarTelefone, linkWhatsapp, LABEL_ORIGEM, type Origem } from '@/lib/pacientes'

export function Pacientes() {
  const [busca, setBusca] = useState('')
  const [termo, setTermo] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setTermo(busca.trim()), 300)
    return () => clearTimeout(id)
  }, [busca])

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes', termo],
    queryFn: () => listarPacientes(termo || undefined),
  })

  const pacientes = data?.pacientes ?? []

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e busca de pacientes</p>
        </div>
        <Button asChild>
          <Link to="/pacientes/novo">
            <Plus className="size-4" />
            Novo paciente
          </Link>
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          className="pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {termo ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="hidden sm:table-cell">Cidade/UF</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes.map((paciente) => {
                  const whats = linkWhatsapp(
                    paciente.telefone,
                    `Olá, ${paciente.nome}! Aqui é do consultório do Dr. Gustavo Amaral.`,
                  )
                  return (
                    <TableRow key={paciente.id}>
                      <TableCell>
                        <Link
                          to={`/pacientes/${paciente.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {paciente.nome}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatarTelefone(paciente.telefone) || '—'}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {[paciente.cidade, paciente.uf].filter(Boolean).join('/') || '—'}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {paciente.origem ? LABEL_ORIGEM[paciente.origem as Origem] : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {whats && (
                          <Button asChild variant="ghost" size="icon-sm" aria-label="Abrir WhatsApp">
                            <a href={whats} target="_blank" rel="noreferrer">
                              <MessageCircle className="size-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
