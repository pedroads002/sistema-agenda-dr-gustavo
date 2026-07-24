import { api } from '@/lib/api'

export const TIPOS_FOTO = ['antes', 'depois'] as const
export type TipoFoto = (typeof TIPOS_FOTO)[number]

export const LABEL_TIPO_FOTO: Record<TipoFoto, string> = {
  antes: 'Antes',
  depois: 'Depois',
}

export type Foto = {
  id: string
  pacienteId: string
  procedimentoRealizadoId: string | null
  procedimentoRealizado: { id: string; procedimento: string; data: string } | null
  tipo: TipoFoto
  descricao: string | null
  data: string
  criadoEm: string
}

export type DadosFoto = {
  pacienteId: string
  procedimentoRealizadoId?: string
  tipo: TipoFoto
  descricao?: string
  data?: string
  arquivo: File
}

export function listarFotos(pacienteId: string) {
  const query = new URLSearchParams({ pacienteId })
  return api<{ fotos: Foto[] }>(`/fotos?${query.toString()}`)
}

export function enviarFoto(dados: DadosFoto) {
  const form = new FormData()
  form.set('pacienteId', dados.pacienteId)
  if (dados.procedimentoRealizadoId) form.set('procedimentoRealizadoId', dados.procedimentoRealizadoId)
  form.set('tipo', dados.tipo)
  if (dados.descricao) form.set('descricao', dados.descricao)
  if (dados.data) form.set('data', dados.data)
  form.set('arquivo', dados.arquivo)
  return api<{ foto: Foto }>('/fotos', { method: 'POST', body: form })
}

export function removerFoto(id: string) {
  return api<null>(`/fotos/${id}`, { method: 'DELETE' })
}

/** URL autenticada da foto — só abre para quem estiver logado (cookie de sessão). */
export function urlArquivoFoto(id: string): string {
  return `/api/fotos/${id}/arquivo`
}

export function formatarDataFoto(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}
