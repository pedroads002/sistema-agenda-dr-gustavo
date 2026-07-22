import { api } from '@/lib/api'

export type Procedimento = {
  id: string
  nome: string
  categoria: string
  valorBase: number
  duracaoMin: number
  ativo: boolean
}

export function listarProcedimentos() {
  return api<{ procedimentos: Procedimento[] }>('/procedimentos')
}
