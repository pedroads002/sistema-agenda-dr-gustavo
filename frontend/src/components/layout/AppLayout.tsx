import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="flex h-svh w-full bg-background text-foreground">
      {/* Menu lateral fixo — telas grandes */}
      <Sidebar className="hidden md:flex" />

      {/* Menu lateral recolhível — mobile */}
      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent side="left" className="w-64 p-0 sm:max-w-none">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Sidebar className="flex" aoNavegar={() => setMenuAberto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior — só aparece no mobile, para abrir o menu */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
          <Logo size={28} />
          <span className="text-sm font-semibold text-foreground">Dr. Gustavo Amaral</span>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
