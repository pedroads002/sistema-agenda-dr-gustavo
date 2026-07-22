import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RotaProtegida } from '@/components/auth/RotaProtegida'
import { Login } from '@/pages/Login'
import { Painel } from '@/pages/Painel'
import { TrocarSenha } from '@/pages/TrocarSenha'
import { Pacientes } from '@/pages/Pacientes'
import { PacienteFormulario } from '@/pages/PacienteFormulario'
import { PacienteFicha } from '@/pages/PacienteFicha'
import { EmConstrucao } from '@/pages/EmConstrucao'
import { itensMenu } from '@/lib/nav'

const CAMINHOS_COM_PAGINA_PROPRIA = ['/', '/pacientes']

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Painel />} />
          <Route path="/trocar-senha" element={<TrocarSenha />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/novo" element={<PacienteFormulario />} />
          <Route path="/pacientes/:id" element={<PacienteFicha />} />
          <Route path="/pacientes/:id/editar" element={<PacienteFormulario />} />
          {itensMenu
            .filter((item) => !CAMINHOS_COM_PAGINA_PROPRIA.includes(item.caminho))
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
