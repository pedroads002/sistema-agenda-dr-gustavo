import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Painel } from '@/pages/Painel'
import { EmConstrucao } from '@/pages/EmConstrucao'
import { itensMenu } from '@/lib/nav'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Painel />} />
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
    </Routes>
  )
}

export default App
