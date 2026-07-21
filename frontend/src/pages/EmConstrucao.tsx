import type { LucideIcon } from 'lucide-react'

type EmConstrucaoProps = {
  titulo: string
  icone: LucideIcon
}

/**
 * Página reservada para um módulo que ainda será construído nas próximas fases.
 */
export function EmConstrucao({ titulo, icone: Icone }: EmConstrucaoProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icone className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">{titulo}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Este módulo ainda será construído nas próximas fases do projeto.
      </p>
    </div>
  )
}
