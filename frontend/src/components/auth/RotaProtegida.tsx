import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function RotaProtegida() {
  const { usuario, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ de: location }} replace />
  }

  return <Outlet />
}
