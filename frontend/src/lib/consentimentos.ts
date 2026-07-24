import { api } from '@/lib/api'

export type Consentimento = {
  id: string
  pacienteId: string
  procedimento: string
  data: string
  assinado: boolean
  temArquivo: boolean
  criadoEm: string
}

export type DadosConsentimento = {
  pacienteId: string
  procedimento: string
  data?: string
  assinado: boolean
  arquivo?: File
}

function paraFormData(dados: DadosConsentimento): FormData {
  const form = new FormData()
  form.set('pacienteId', dados.pacienteId)
  form.set('procedimento', dados.procedimento)
  if (dados.data) form.set('data', dados.data)
  form.set('assinado', String(dados.assinado))
  if (dados.arquivo) form.set('arquivo', dados.arquivo)
  return form
}

export function listarConsentimentos(pacienteId: string) {
  const query = new URLSearchParams({ pacienteId })
  return api<{ consentimentos: Consentimento[] }>(`/consentimentos?${query.toString()}`)
}

export function criarConsentimento(dados: DadosConsentimento) {
  return api<{ consentimento: Consentimento }>('/consentimentos', { method: 'POST', body: paraFormData(dados) })
}

export function atualizarConsentimento(id: string, dados: DadosConsentimento) {
  return api<{ consentimento: Consentimento }>(`/consentimentos/${id}`, {
    method: 'PUT',
    body: paraFormData(dados),
  })
}

export function removerConsentimento(id: string) {
  return api<null>(`/consentimentos/${id}`, { method: 'DELETE' })
}

/** URL autenticada do anexo — só abre para quem estiver logado (cookie de sessão). */
export function urlArquivoConsentimento(id: string): string {
  return `/api/consentimentos/${id}/arquivo`
}

export function formatarDataConsentimento(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data))
}
