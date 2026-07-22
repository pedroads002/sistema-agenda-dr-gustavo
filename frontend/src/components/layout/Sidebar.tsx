import { NavLink, useNavigate } from 'react-router-dom'
import { KeyRound, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { itensMenu } from '@/lib/nav'
import { Logo } from '@/components/brand/Logo'
import { useAuth } from '@/lib/auth'

type SidebarProps = {
  className?: string
  aoNavegar?: () => void
}

const classeLinkSecundario =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

export function Sidebar({ className, aoNavegar }: SidebarProps) {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()

  async function aoClicarSair() {
    await sair()
    navigate('/login', { replace: true })
  }

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

      <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
        {usuario && (
          <div className="px-2 pb-1">
            <p className="truncate text-sm font-medium">{usuario.nome}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{usuario.email}</p>
          </div>
        )}

        <NavLink to="/trocar-senha" onClick={aoNavegar} className={classeLinkSecundario}>
          <KeyRound className="size-4 shrink-0" />
          <span>Trocar senha</span>
        </NavLink>

        <button type="button" onClick={aoClicarSair} className={cn('w-full', classeLinkSecundario)}>
          <LogOut className="size-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
