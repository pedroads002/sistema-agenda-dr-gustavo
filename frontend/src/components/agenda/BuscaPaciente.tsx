import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { listarPacientes, LABEL_ORIGEM, type Origem } from '@/lib/pacientes'

export type PacienteResumo = {
  id: string
  nome: string
  telefone: string | null
  origem: string | null
}

export function BuscaPaciente({
  value,
  onChange,
}: {
  value: PacienteResumo | null
  onChange: (paciente: PacienteResumo | null) => void
}) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<PacienteResumo[]>([])
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!termo.trim()) {
      setResultados([])
      return
    }
    const id = setTimeout(() => {
      listarPacientes(termo.trim()).then((resposta) => setResultados(resposta.pacientes.slice(0, 8)))
    }, 300)
    return () => clearTimeout(id)
  }, [termo])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-foreground">{value.nome}</p>
          {value.origem && (
            <p className="text-xs text-muted-foreground">Origem: {LABEL_ORIGEM[value.origem as Origem]}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Trocar paciente"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar paciente por nome ou telefone"
        className="pl-8"
        value={termo}
        onChange={(evento) => {
          setTermo(evento.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
      />
      {aberto && resultados.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {resultados.map((paciente) => (
            <button
              key={paciente.id}
              type="button"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                onChange(paciente)
                setTermo('')
                setAberto(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {paciente.nome}
              {paciente.telefone && <span className="text-muted-foreground"> · {paciente.telefone}</span>}
            </button>
          ))}
        </div>
      )}
      {aberto && termo.trim().length > 0 && resultados.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover p-3 text-sm text-muted-foreground shadow-md">
          Nenhum paciente encontrado.
        </div>
      )}
    </div>
  )
}
