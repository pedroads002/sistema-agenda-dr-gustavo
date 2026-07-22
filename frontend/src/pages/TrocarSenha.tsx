import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ErroApi } from '@/lib/api'

const schema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    novaSenha: z.string().min(8, 'A nova senha precisa ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type FormTrocarSenha = z.infer<typeof schema>

export function TrocarSenha() {
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormTrocarSenha>({ resolver: zodResolver(schema) })

  async function aoEnviar(dados: FormTrocarSenha) {
    setMensagem(null)
    try {
      await api('/auth/trocar-senha', {
        method: 'POST',
        body: JSON.stringify({ senhaAtual: dados.senhaAtual, novaSenha: dados.novaSenha }),
      })
      setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso.' })
      reset()
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível trocar a senha.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Trocar senha</h1>
          <p className="text-sm text-muted-foreground">Atualize a senha da sua conta</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(aoEnviar)}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="senhaAtual">Senha atual</Label>
          <Input id="senhaAtual" type="password" autoComplete="current-password" {...register('senhaAtual')} />
          {errors.senhaAtual && <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <Input id="novaSenha" type="password" autoComplete="new-password" {...register('novaSenha')} />
          {errors.novaSenha && <p className="text-xs text-destructive">{errors.novaSenha.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
          <Input
            id="confirmarSenha"
            type="password"
            autoComplete="new-password"
            {...register('confirmarSenha')}
          />
          {errors.confirmarSenha && (
            <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
          )}
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
          {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </div>
  )
}
