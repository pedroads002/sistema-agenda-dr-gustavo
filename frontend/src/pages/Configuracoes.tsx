import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, KeyRound, DownloadCloud, ShieldAlert, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErroApi } from '@/lib/api'
import { buscarConfiguracoes, atualizarConfiguracoes, type DadosConfiguracao } from '@/lib/configuracoes'

const opcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor ? valor : undefined))

const schema = z.object({
  nomeConsultorio: z.string().trim().min(1, 'Informe o nome do consultório'),
  nomeProfissional: z.string().trim().min(1, 'Informe o nome do profissional'),
  registroProfissional: opcional,
  telefone: opcional,
  email: opcional.pipe(z.string().email('E-mail inválido').optional()),
  endereco: opcional,
  cidade: opcional,
  uf: opcional
    .transform((valor) => valor?.toUpperCase())
    .pipe(z.string().length(2, 'UF deve ter 2 letras').optional()),
})

type FormConfiguracao = z.infer<typeof schema>

export function Configuracoes() {
  const queryClient = useQueryClient()
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: buscarConfiguracoes,
  })
  const configuracao = data?.configuracao

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormConfiguracao>({
    resolver: zodResolver(schema),
    values: configuracao
      ? {
          nomeConsultorio: configuracao.nomeConsultorio,
          nomeProfissional: configuracao.nomeProfissional,
          registroProfissional: configuracao.registroProfissional ?? '',
          telefone: configuracao.telefone ?? '',
          email: configuracao.email ?? '',
          endereco: configuracao.endereco ?? '',
          cidade: configuracao.cidade ?? '',
          uf: configuracao.uf ?? '',
        }
      : undefined,
  })

  async function aoEnviar(dados: FormConfiguracao) {
    setMensagem(null)
    try {
      const payload: DadosConfiguracao = dados
      await atualizarConfiguracoes(payload)
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso.' })
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível salvar as configurações.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados do consultório, segurança e backup</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <CardTitle className="text-sm">Dados do consultório</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-destructive">Não foi possível carregar as configurações.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="size-4" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(aoEnviar)} className="space-y-4" noValidate>
              <p className="text-xs text-muted-foreground">
                Esses dados aparecem no cabeçalho dos orçamentos e demais documentos impressos.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeConsultorio">Nome do consultório</Label>
                  <Input id="nomeConsultorio" {...register('nomeConsultorio')} />
                  {errors.nomeConsultorio && (
                    <p className="text-xs text-destructive">{errors.nomeConsultorio.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nomeProfissional">Nome do profissional</Label>
                  <Input id="nomeProfissional" {...register('nomeProfissional')} />
                  {errors.nomeProfissional && (
                    <p className="text-xs text-destructive">{errors.nomeProfissional.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="registroProfissional">Registro profissional (CRM)</Label>
                  <Input id="registroProfissional" placeholder="Ex.: CRM 12345/PE" {...register('registroProfissional')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                  <Input id="telefone" placeholder="(11) 98765-4321" {...register('telefone')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" {...register('endereco')} />
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" {...register('cidade')} />
                </div>
                <div className="w-20 space-y-1.5">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" maxLength={2} className="uppercase" {...register('uf')} />
                  {errors.uf && <p className="text-xs text-destructive">{errors.uf.message}</p>}
                </div>
              </div>

              {mensagem && (
                <p
                  className={
                    mensagem.tipo === 'sucesso'
                      ? 'rounded-lg bg-success/10 px-3 py-2 text-sm text-success'
                      : 'rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'
                  }
                >
                  {mensagem.texto}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <CardTitle className="text-sm">Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Altere a senha da sua conta de acesso ao sistema.</p>
          <Button variant="outline" asChild>
            <Link to="/trocar-senha">
              <KeyRound className="size-4" />
              Trocar senha
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <DownloadCloud className="size-4 text-primary" />
          <CardTitle className="text-sm">Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O backup gera um arquivo .zip com o banco de dados e todas as fotos e anexos enviados. Guarde esse
            arquivo em um local seguro (ex.: um pendrive ou um serviço de nuvem pessoal) — ele fica só no seu
            computador, o sistema não envia nada automaticamente.
          </p>
          <Button asChild>
            <a href="/api/backup/exportar">
              <DownloadCloud className="size-4" />
              Exportar backup (.zip)
            </a>
          </Button>

          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Como restaurar um backup</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Feche o sistema (pare o backend).</li>
              <li>
                Substitua o arquivo <code className="text-foreground">backend/data/consultorio.db</code> pelo arquivo{' '}
                <code className="text-foreground">consultorio.db</code> do backup.
              </li>
              <li>
                Substitua a pasta <code className="text-foreground">backend/src/uploads</code> pela pasta{' '}
                <code className="text-foreground">uploads</code> do backup.
              </li>
              <li>Inicie o sistema novamente.</li>
            </ol>
          </div>

          <p className="text-xs text-warning">
            Recomendação: faça um backup com frequência (por exemplo, toda semana), especialmente antes de qualquer
            atualização do sistema.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldAlert className="size-4 text-warning" />
          <CardTitle className="text-sm">Privacidade e LGPD</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este sistema guarda dados sensíveis de saúde dos pacientes (anamnese, procedimentos, fotos e
            documentos). Por isso:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>O acesso ao sistema é sempre protegido por login e senha — nunca compartilhe sua senha.</li>
            <li>Mantenha o computador do consultório protegido com senha e, se possível, com o disco criptografado (FileVault no Mac, BitLocker no Windows).</li>
            <li>Fotos e anexos só podem ser vistos por quem está logado no sistema.</li>
            <li>Nada é enviado para serviços externos sem uma ação explícita sua (ex.: o botão de WhatsApp).</li>
            <li>Faça backups frequentes e guarde-os em local seguro — eles também contêm dados sensíveis.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
