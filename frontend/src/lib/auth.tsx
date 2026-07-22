import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

type Usuario = {
  id: string
  nome: string
  email: string
}

type ContextoAuth = {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<ContextoAuth | null>(null)

async function buscarUsuarioLogado(): Promise<Usuario | null> {
  try {
    const resultado = await api<{ usuario: Usuario }>('/auth/me')
    return resultado.usuario
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: buscarUsuarioLogado,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const entrarMutation = useMutation({
    mutationFn: ({ email, senha }: { email: string; senha: string }) =>
      api<{ usuario: Usuario }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['auth', 'me'], resultado.usuario)
    },
  })

  const sairMutation = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })

  return (
    <AuthContext.Provider
      value={{
        usuario: data ?? null,
        carregando: isLoading,
        entrar: async (email, senha) => {
          await entrarMutation.mutateAsync({ email, senha })
        },
        sair: async () => {
          await sairMutation.mutateAsync()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  }
  return contexto
}
