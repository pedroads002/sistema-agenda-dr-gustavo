# Adendo 02 — Procedimentos e Prontuário (Fase 4)

Complemento ao `DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md`. Define o **catálogo de procedimentos**
e o **prontuário clínico** (procedimentos realizados) do Dr. Gustavo Amaral. Onde divergir do
documento original, **vale este adendo**.

## Parte A — Catálogo de Procedimentos

Tela para cadastrar/listar/editar/desativar os serviços oferecidos. O Dr. Gustavo edita nomes,
preços e durações por conta própria; os valores abaixo ficam **em branco** para ele preencher.

### Ajuste no modelo `Procedimento`
Adicionar o campo `ordem` (para controlar a ordem de exibição por prioridade). Gerar migração.

```prisma
model Procedimento {
  id          String   @id @default(cuid())
  nome        String
  categoria   String   // intima_masculina | intima_feminina | corporal | facial
  valorBase   Float    @default(0)
  duracaoMin  Int      @default(60)
  ordem       Int      @default(0)   // menor = aparece primeiro (prioridade)
  ativo       Boolean  @default(true)
  criadoEm    DateTime @default(now())
}
```

### Catálogo inicial (seed) — na ordem de prioridade do cliente
Categorias e itens (preço/duração em branco para ele preencher):

1. **Harmonização íntima masculina (preenchimento peniano)** — categoria `intima_masculina` — *carro-chefe* — ordem 1
2. **Harmonização íntima feminina** — categoria `intima_feminina` — ordem 2
3. **Harmonização corporal** — categoria `corporal` — ordem 3
4. **Lipo pubiana masculina** — categoria `intima_masculina` — ordem 4
5. **Harmonização facial** — categoria `facial` — ordem 5
6. **Lipo pubiana feminina** — categoria `intima_feminina` — ordem 6

Rótulos das categorias na interface: Íntima masculina, Íntima feminina, Corporal, Facial.
(O Dr. Gustavo pode recategorizar/renomear/adicionar procedimentos livremente na tela.)

## Parte B — Prontuário / Procedimentos realizados

Registro clínico do que foi aplicado em cada atendimento. **Decisão do cliente:** manter
flexível — o profissional preenche os campos técnicos como quiser. O sistema oferece campos
estruturados (opcionais) **e** um campo de texto livre.

### Modelo de dados
Substituir o modelo `ProcedimentoRealizado` atual (que tinha um único produto/lote) por um
modelo com **lista de produtos aplicados** (vários por sessão) + observações livres. Adicionar
também o modelo filho `ProdutoAplicado`. Gerar migração.

```prisma
model ProcedimentoRealizado {
  id            String   @id @default(cuid())
  paciente      Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId    String
  agendamento   Agendamento? @relation(fields: [agendamentoId], references: [id])
  agendamentoId String?      // vínculo opcional com o atendimento da agenda
  data          DateTime @default(now())
  procedimento  String   // nome (do catálogo)
  observacoes   String?  // anotações clínicas livres / intercorrências
  criadoEm      DateTime @default(now())

  produtos      ProdutoAplicado[]
}

model ProdutoAplicado {
  id                       String  @id @default(cuid())
  procedimentoRealizado    ProcedimentoRealizado @relation(fields: [procedimentoRealizadoId], references: [id], onDelete: Cascade)
  procedimentoRealizadoId  String
  produto      String?   // marca / substância
  lote         String?
  validade     DateTime?
  quantidade   String?   // ex.: "2 ml", "50 UI"
  regiao       String?
}
```

Também adicionar em `Agendamento` a relação inversa:
```prisma
// dentro do model Agendamento
procedimentosRealizados  ProcedimentoRealizado[]
```

### Comportamento da tela
- O prontuário é acessado pela **ficha do paciente** (na seção "Procedimentos realizados").
- Botão "Registrar procedimento": escolher o procedimento (do catálogo), data, e — opcionalmente
  — vincular a um agendamento existente do paciente.
- Dentro do registro, uma **tabela de produtos aplicados** onde é possível **adicionar várias
  linhas** (produto, lote, validade, quantidade, região). Todos os campos são opcionais.
- Um campo de **observações clínicas** (texto livre).
- Listar, editar e excluir registros; ordenados por data (mais recente primeiro).
- Deixar preparada (mesmo que vazia por enquanto) a associação com **fotos antes/depois**, que
  vem na Fase 7.

## Sensibilidade / LGPD
Estes dados (procedimentos íntimos, produtos, observações clínicas) são **altamente sensíveis**.
Devem ficar sempre atrás do login, nunca expostos em URLs públicas, e incluídos no backup com o
mesmo cuidado do restante.

## Critérios de aceite (Fase 4)
- Vejo o catálogo já preenchido com os 6 procedimentos, na ordem de prioridade, por categoria.
- Consigo criar/editar/desativar um procedimento e definir preço e duração.
- Na ficha do paciente, consigo registrar um procedimento realizado com **várias linhas de
  produto** e um texto de observações, e depois editá-lo/excluí-lo.
- Consigo (opcionalmente) vincular o registro a um agendamento do paciente.
