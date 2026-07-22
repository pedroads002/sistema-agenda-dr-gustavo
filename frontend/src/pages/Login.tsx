import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { ErroApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe a senha'),
})

type FormLogin = z.infer<typeof schema>

export function Login() {
  const { entrar, usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (usuario) {
      const destino = (location.state as { de?: { pathname: string } } | null)?.de?.pathname ?? '/'
      navigate(destino, { replace: true })
    }
  }, [usuario, navigate, location.state])

  async function aoEnviar(dados: FormLogin) {
    setErro(null)
    try {
      await entrar(dados.email, dados.senha)
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof ErroApi
          ? erroCapturado.message
          : 'Não foi possível entrar. Tente novamente.',
      )
    }
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={56} />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dr. Gustavo Amaral</h1>
            <p className="text-sm text-muted-foreground">Entre para acessar o sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(aoEnviar)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="username" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" autoComplete="current-password" {...register('senha')} />
            {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
          </div>

          {erro && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
