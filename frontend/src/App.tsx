import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RotaProtegida } from '@/components/auth/RotaProtegida'
import { Login } from '@/pages/Login'
import { Painel } from '@/pages/Painel'
import { TrocarSenha } from '@/pages/TrocarSenha'
import { EmConstrucao } from '@/pages/EmConstrucao'
import { itensMenu } from '@/lib/nav'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Painel />} />
          <Route path="/trocar-senha" element={<TrocarSenha />} />
          {itensMenu
            .filter((item) => item.caminho !== '/')
            .map((item) => (
              <Route
                key={item.caminho}
                path={item.caminho}
                element={<EmConstrucao titulo={item.rotulo} icone={item.icone} />}
              />
            ))}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
