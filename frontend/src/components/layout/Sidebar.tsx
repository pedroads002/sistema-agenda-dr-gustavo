import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { itensMenu } from '@/lib/nav'
import { Logo } from '@/components/brand/Logo'

type SidebarProps = {
  className?: string
  aoNavegar?: () => void
}

export function Sidebar({ className, aoNavegar }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo size={36} />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Dr. Gustavo Amaral</p>
          <p className="text-xs text-sidebar-foreground/60">Harmonização Estética</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {itensMenu.map((item) => {
          const Icone = item.icone
          return (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              end={item.caminho === '/'}
              onClick={aoNavegar}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icone className="size-4 shrink-0" />
              <span className="truncate">{item.rotulo}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-sidebar-foreground/50">
        Versão de desenvolvimento
      </div>
    </aside>
  )
}
