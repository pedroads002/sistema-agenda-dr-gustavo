import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  Stethoscope,
  FileText,
  Wallet,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type ItemMenu = {
  rotulo: string
  caminho: string
  icone: LucideIcon
}

export const itensMenu: ItemMenu[] = [
  { rotulo: 'Painel', caminho: '/', icone: LayoutDashboard },
  { rotulo: 'Pacientes', caminho: '/pacientes', icone: Users },
  { rotulo: 'Agenda', caminho: '/agenda', icone: Calendar },
  { rotulo: 'Procedimentos', caminho: '/procedimentos', icone: Sparkles },
  { rotulo: 'Prontuário', caminho: '/prontuario', icone: Stethoscope },
  { rotulo: 'Orçamentos', caminho: '/orcamentos', icone: FileText },
  { rotulo: 'Financeiro', caminho: '/financeiro', icone: Wallet },
  { rotulo: 'Configurações', caminho: '/configuracoes', icone: Settings },
]
