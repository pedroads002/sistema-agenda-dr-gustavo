# Adendo 01 — Agenda (Fase 3)

Complemento ao `DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md`. Define as regras da **Agenda** do
Dr. Gustavo Amaral. Onde este adendo divergir do documento original, **vale este adendo**.

## Contexto
O Dr. Gustavo é de Recife, mas atende em **várias cidades e estados**. A agenda precisa:
- Ser filtrável por **dia, semana e mês**.
- Registrar em **qual local/cidade** cada atendimento acontece.
- Permitir **bloquear** dias inteiros ou horários específicos (viagem, compromisso pessoal),
  impedindo agendamentos nesses momentos.
- Usar os status de atendimento definidos pelo cliente.

## Alterações no modelo de dados

Adicionar dois modelos novos (`Local` e `Bloqueio`) e ajustar o `Agendamento`. Gerar a
migração correspondente.

```prisma
// NOVO — locais/cidades onde o Dr. Gustavo atende
model Local {
  id            String        @id @default(cuid())
  nome          String        // ex.: "Consultório Recife", "Clínica Parceira SP"
  cidade        String
  uf            String
  endereco      String?
  ativo         Boolean       @default(true)
  criadoEm      DateTime      @default(now())
  agendamentos  Agendamento[]
}

// NOVO — bloqueios de indisponibilidade (dia inteiro ou faixa de horário)
model Bloqueio {
  id          String   @id @default(cuid())
  data        DateTime // o dia do bloqueio
  diaInteiro  Boolean  @default(true)
  horaInicio  String?  // "HH:MM" — usado quando NÃO for dia inteiro
  horaFim     String?  // "HH:MM"
  motivo      String?
  criadoEm    DateTime @default(now())
}

// AJUSTAR o modelo Agendamento existente para ficar assim:
model Agendamento {
  id                String    @id @default(cuid())
  paciente          Paciente  @relation(fields: [pacienteId], references: [id])
  pacienteId        String
  local             Local?    @relation(fields: [localId], references: [id])
  localId           String?
  inicio            DateTime
  fim               DateTime?
  procedimentoNome  String?   // escolhido do catálogo de Procedimentos
  descricao         String?   // informações gerais do agendamento (observações do contato etc.)
  status            String    @default("a_confirmar") // ver lista de status abaixo
  observacoes       String?
  criadoEm          DateTime  @default(now())
}
```

## Status do agendamento (usar exatamente estes)
Valores internos e rótulos exibidos:
- `a_confirmar` → **A confirmar** (padrão ao criar)
- `confirmado` → **Confirmado**
- `compareceu` → **Compareceu**
- `desmarcou` → **Desmarcou**
- `faltou` → **Faltou**

Sugestão de cores (coerentes com o design system): A confirmar = azul-aço; Confirmado = azul
primário; Compareceu = verde (sucesso); Desmarcou = cinza; Faltou = âmbar (atenção).

## Sobre "origem" (marketing x orgânico)
A **origem** (como o paciente conheceu) já é um campo do **Paciente** (Fase 2). Na tela de
agendamento, quando um paciente é selecionado, **exibir a origem dele** apenas como informação
(somente leitura). O campo `descricao` do agendamento serve para anotações gerais daquele
atendimento específico.

## Funcionalidades da tela de Agenda
1. **Visões dia / semana / mês** (alternáveis por botões), com navegação para frente/trás e
   atalho "Hoje".
   - Dia: lista dos horários do dia.
   - Semana: grade dos 7 dias.
   - Mês: visão geral (marcações/contagem por dia).
2. **Filtro por local/cidade** (mostrar só os atendimentos de determinado local).
3. **Criar / editar / excluir agendamento**, com: paciente (busca), procedimento (do catálogo),
   local, data, hora início, hora fim (ou duração), status e descrição.
4. **Confirmação por WhatsApp** (link `wa.me`, sem API paga) com mensagem pronta.
5. **Indicação visual dos bloqueios** na agenda (dias/horários indisponíveis aparecem marcados).

## Bloqueios (indisponibilidade)
- Tela/opção para **criar bloqueios**: escolher a data, marcar "dia inteiro" **ou** informar
  hora de início e fim, e um motivo opcional.
- Listar e excluir bloqueios.
- O bloqueio vale para a agenda toda (o profissional está indisponível naquele momento).

## Regras de negócio da agenda
- Ao salvar um agendamento, o sistema deve **impedir** (com mensagem clara) se:
  - o horário cair sobre um **bloqueio** (dia inteiro do dia bloqueado, ou faixa de horário
    que se sobreponha ao bloqueio);
  - houver **conflito** com outro agendamento no mesmo horário (avisar; permitir só se o
    usuário confirmar explicitamente, caso ele queira sobrepor de propósito).
- Status padrão ao criar: **A confirmar**.
- Datas/horas no fuso de Brasília; guardar de forma consistente e exibir local.

## Critérios de aceite (Fase 3)
- Consigo cadastrar locais e ver a agenda filtrando por cidade.
- Consigo criar um agendamento vinculado a paciente, procedimento e local, com status.
- Consigo alternar entre dia, semana e mês.
- Um bloqueio de dia inteiro impede qualquer agendamento naquele dia; um bloqueio por horário
  impede agendamentos que se sobreponham à faixa.
- O botão de WhatsApp abre a conversa com a mensagem de confirmação pronta.
