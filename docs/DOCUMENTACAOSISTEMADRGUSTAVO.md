# Sistema de Gestão — Dr. Gustavo Amaral

Documento de arranque para desenvolvimento no **Claude Code**.
Versão 1.0 — Julho/2026 · Herval Marketing

> Este documento é o "briefing técnico" completo do sistema. A ideia é: você cria a pasta do projeto, coloca este arquivo (e o `CLAUDE.md`) dentro dela, abre o Claude Code e usa o **Prompt Inicial** (seção 12) para começar. Todo o resto serve de referência para o Claude Code e para você durante o desenvolvimento.

---

## 1. Visão geral

Sistema web de gestão para o consultório do **Dr. Gustavo Amaral**, especializado em **harmonização** (facial, íntima masculina, íntima feminina e corporal) e procedimentos estéticos injetáveis.

O sistema substitui o uso atual de Google Agenda + caderno de papel, centralizando agenda, pacientes, prontuário dos procedimentos, orçamentos e financeiro num único lugar, com aparência profissional e a identidade visual da marca.

O MVP já foi validado e aprovado pelo cliente. Este documento descreve a **versão "de verdade"**: banco de dados real, login, e uma base de código organizada e escalável.

## 2. Objetivo e princípios

- **Sem dependência de serviços externos ou APIs pagas.** Tudo roda de forma autossuficiente (self-hosted). Nenhuma mensalidade de terceiros, nenhuma integração externa obrigatória.
- **Uso no navegador, no computador do consultório.** Roda localmente na máquina do Dr. Gustavo. Fica preparado para, no futuro, ser acessado também pelo celular (mesma rede ou via um servidor próprio) — sem reescrever o sistema.
- **Um único perfil de acesso.** No início, só o Dr. Gustavo usa. Se futuramente houver secretária/recepção, ela usa **login e senha com as mesmas permissões** (sem níveis de acesso diferentes por enquanto). A tabela de usuários já existe, então adicionar mais gente depois é simples.
- **Dados sensíveis levados a sério (LGPD).** São dados de saúde. O sistema roda local, com senha, e faz backup do banco. Consentimento e anamnese ficam registrados.
- **Aparência clean e profissional.** Nada de emojis na interface: ícones de verdade (biblioteca de ícones), tipografia consistente e a paleta da logo.

## 3. Stack técnica

Escolhida para ser robusta, self-hosted, sem custo de licença e confortável para o Claude Code construir e manter.

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS para estilos
- shadcn/ui para componentes (botões, modais, tabelas, formulários)
- **lucide-react** para ícones (substitui os emojis do MVP)
- React Router para navegação
- TanStack Query (React Query) para comunicação com o backend
- react-hook-form + zod para formulários e validação

**Backend**
- Node.js (versão 22 LTS ou superior)
- Fastify (servidor HTTP leve e rápido)
- Prisma ORM como camada do banco de dados
- **SQLite** como banco (arquivo único, sem servidor de banco separado)
- Autenticação própria: senha com **bcrypt** + sessão via **JWT** (cookie httpOnly). Sem serviço externo de login.
- zod para validação dos dados na entrada da API

**Banco de dados: por que SQLite**
- É um único arquivo (`.db`) na máquina. Sem instalar Postgres/MySQL, sem servidor de banco rodando à parte.
- Backup = copiar o arquivo. Restaurar = colar o arquivo de volta.
- Aguenta tranquilamente o volume de um consultório individual.
- Se um dia o sistema for para um servidor com muitos usuários simultâneos, o Prisma permite trocar para PostgreSQL mudando pouca coisa (o modelo de dados continua o mesmo).

**Ferramentas de apoio**
- Git para versionamento
- ESLint + Prettier para padronização de código

## 4. Arquitetura e como roda

O sistema é composto por duas partes que rodam na mesma máquina:

1. **Backend (API):** um processo Node que expõe a API e conversa com o banco SQLite.
2. **Frontend (interface):** as telas React, servidas para o navegador.

No dia a dia, o Dr. Gustavo abre o sistema no navegador (ex.: `http://localhost:3000`). Em desenvolvimento, front e back rodam separados; para o uso real, o ideal é gerar um **build de produção** e um atalho/script que sobe tudo com um clique (o Claude Code monta esse script).

**Evolução futura (sem mudar o código):**
- **Acesso pelo celular na mesma rede:** basta o sistema escutar no IP local; o celular acessa pelo IP da máquina.
- **Acesso de qualquer lugar:** subir a mesma aplicação num VPS próprio (servidor barato que você controla) e apontar um domínio. Aí o SQLite pode ser mantido ou migrado para PostgreSQL. Continua sem depender de API de terceiros.

## 5. Módulos e funcionalidades

### 5.1 Autenticação
- Tela de login (e-mail + senha) com a marca do Dr. Gustavo.
- Senha guardada com hash (bcrypt), nunca em texto puro.
- Sessão por cookie seguro (JWT httpOnly).
- Primeiro acesso: um usuário administrador é criado por um script de "seed".
- Tela para trocar a própria senha.

### 5.2 Painel (Dashboard)
- Resumo do dia: atendimentos de hoje, próximos horários.
- Indicadores: recebido no mês, a receber (orçamentos aprovados em aberto), nº de pacientes, orçamentos pendentes.
- Aniversariantes dos próximos dias (ação de relacionamento).
- Atalhos rápidos: novo agendamento, novo paciente, novo orçamento.

### 5.3 Pacientes
- Cadastro completo: nome, CPF, telefone/WhatsApp, e-mail, nascimento, sexo, endereço, observações.
- Busca por nome ou telefone.
- **Ficha do paciente** reunindo tudo: dados, histórico de atendimentos, procedimentos realizados, orçamentos, pagamentos, anamnese, consentimentos e fotos antes/depois.
- Botão de WhatsApp que abre a conversa com mensagem pronta (link `wa.me` — não usa API paga; apenas abre o WhatsApp do usuário).

### 5.4 Agenda
- Visão por dia (e, idealmente, por semana).
- Criar/editar/remover agendamentos, vinculados a um paciente e a um procedimento.
- Status do atendimento: agendado, confirmado, atendido, faltou, cancelado.
- Prevenção de conflito de horário (avisar se já existe atendimento no mesmo horário).
- Botão de confirmação por WhatsApp (mensagem pronta).

### 5.5 Procedimentos (catálogo)
- Cadastro dos serviços oferecidos, organizados por categoria: **harmonização facial, harmonização íntima masculina, harmonização íntima feminina, harmonização corporal**, além de toxina botulínica, preenchimento, bioestimulador etc.
- Cada procedimento tem valor base e duração padrão (puxados automaticamente na agenda e no orçamento).

### 5.6 Prontuário / Procedimentos realizados (clínico)
Registro clínico de cada procedimento aplicado — importante médico-legalmente em harmonização:
- Data, procedimento e paciente.
- **Produto/substância utilizada, lote, validade e quantidade (ml/UI).**
- Regiões/áreas de aplicação.
- Observações clínicas e intercorrências.
- Vínculo com fotos antes/depois.

### 5.7 Orçamentos
- Montagem com múltiplos itens (procedimento, quantidade, valor), desconto e total.
- Status: pendente, aprovado, recusado.
- Impressão / geração de PDF com o cabeçalho da marca.
- Envio por WhatsApp com o texto do orçamento formatado.
- Quando aprovado, alimenta o "a receber" do financeiro; pagamentos abatem o saldo.

### 5.8 Financeiro
- Registro de pagamentos (valor, data, forma: Pix, dinheiro, cartão etc., referência).
- Vínculo opcional do pagamento a um orçamento (controle de saldo/parcelas).
- Faturamento por mês, total recebido, total a receber.
- Relatório simples por período e por forma de pagamento.

### 5.9 Anamnese e Consentimento
- **Ficha de anamnese** (questionário de saúde) preenchida por procedimento/paciente, guardada em formato estruturado.
- **Termo de consentimento** por procedimento: registro de que foi assinado, com possibilidade de anexar o documento (PDF/imagem).

### 5.10 Fotos antes/depois
- Upload de fotos vinculadas ao paciente e ao procedimento, marcadas como "antes" ou "depois".
- Armazenadas em pasta local do sistema (não em nuvem de terceiros).
- Visualização comparativa na ficha do paciente.

### 5.11 Configurações e Backup
- Dados do consultório (nome, profissional, registro/CRM, contato) usados nos cabeçalhos de orçamento/PDF.
- Gestão do catálogo de procedimentos.
- **Backup:** exportar/copiar o arquivo do banco e a pasta de fotos; importar/restaurar. Recomendação de rotina de backup.

## 6. Regras de negócio e observações importantes

- **Harmonização exige rastreabilidade:** todo procedimento aplicado precisa registrar produto, lote, validade e quantidade. Isso protege o profissional e o paciente.
- **Consentimento antes do procedimento:** o sistema deve deixar claro na ficha quando falta o termo assinado.
- **LGPD:** dados de saúde são sensíveis. Acesso protegido por senha; nada é enviado para fora sem ação explícita do usuário; backups devem ser guardados com cuidado. Incluir um aviso na tela de configurações.
- **Sem API paga:** o botão de WhatsApp usa apenas o link `wa.me` (abre o app do usuário) — isso não é integração paga. Geração de PDF é feita localmente. Nada depende de serviço externo.
- **Valores monetários** sempre em Real (BRL), com duas casas. Guardar como número; formatar na exibição.
- **Datas/horas** no fuso de Brasília; guardar de forma consistente (ISO/UTC no banco, exibir local).

## 7. Modelo de dados

Tabelas principais e seus relacionamentos. Abaixo, o **schema Prisma** pronto para servir de base (o Claude Code vai refiná-lo).

- **Usuario** — quem acessa o sistema.
- **Paciente** — cadastro; centro de quase tudo.
- **Procedimento** — catálogo de serviços.
- **Agendamento** — horários na agenda.
- **ProcedimentoRealizado** — prontuário clínico (produto/lote/quantidade).
- **Orcamento** / **OrcamentoItem** — propostas e seus itens.
- **Pagamento** — recebimentos, opcionalmente ligados a um orçamento.
- **Anamnese** — questionário de saúde.
- **Consentimento** — termo assinado por procedimento.
- **Foto** — antes/depois.

```prisma
// schema.prisma — base inicial (SQLite)
datasource db {
  provider = "sqlite"
  url      = "file:./data/consultorio.db"
}

generator client {
  provider = "prisma-client-js"
}

model Usuario {
  id            String   @id @default(cuid())
  nome          String
  email         String   @unique
  senhaHash     String
  ativo         Boolean  @default(true)
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt
}

model Paciente {
  id            String   @id @default(cuid())
  nome          String
  cpf           String?
  telefone      String?
  email         String?
  nascimento    DateTime?
  sexo          String?
  endereco      String?
  observacoes   String?
  criadoEm      DateTime @default(now())
  atualizadoEm  DateTime @updatedAt

  agendamentos     Agendamento[]
  orcamentos       Orcamento[]
  procedimentos    ProcedimentoRealizado[]
  pagamentos       Pagamento[]
  anamneses        Anamnese[]
  consentimentos   Consentimento[]
  fotos            Foto[]
}

model Procedimento {
  id          String   @id @default(cuid())
  nome        String
  categoria   String   // facial | intima_masculina | intima_feminina | corporal | outros
  valorBase   Float    @default(0)
  duracaoMin  Int      @default(60)
  ativo       Boolean  @default(true)
  criadoEm    DateTime @default(now())
}

model Agendamento {
  id                String   @id @default(cuid())
  paciente          Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId        String
  inicio            DateTime
  fim               DateTime?
  procedimentoNome  String?
  status            String   @default("agendado") // agendado|confirmado|atendido|faltou|cancelado
  observacoes       String?
  criadoEm          DateTime @default(now())
}

model Orcamento {
  id           String   @id @default(cuid())
  paciente     Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId   String
  data         DateTime @default(now())
  status       String   @default("pendente") // pendente|aprovado|recusado
  desconto     Float    @default(0)
  observacoes  String?
  criadoEm     DateTime @default(now())

  itens        OrcamentoItem[]
  pagamentos   Pagamento[]
}

model OrcamentoItem {
  id           String    @id @default(cuid())
  orcamento    Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  orcamentoId  String
  descricao    String
  quantidade   Int       @default(1)
  valorUnit    Float     @default(0)
}

model ProcedimentoRealizado {
  id            String   @id @default(cuid())
  paciente      Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId    String
  data          DateTime @default(now())
  procedimento  String
  produto       String?
  lote          String?
  validade      DateTime?
  quantidade    String?  // ex.: "2 ml", "50 UI"
  regioes       String?
  observacoes   String?
  criadoEm      DateTime @default(now())
}

model Pagamento {
  id           String     @id @default(cuid())
  paciente     Paciente   @relation(fields: [pacienteId], references: [id])
  pacienteId   String
  orcamento    Orcamento? @relation(fields: [orcamentoId], references: [id])
  orcamentoId  String?
  data         DateTime   @default(now())
  valor        Float
  forma        String     // Pix|Dinheiro|Cartão débito|Cartão crédito|Transferência|Outro
  referencia   String?
  criadoEm     DateTime   @default(now())
}

model Anamnese {
  id           String   @id @default(cuid())
  paciente     Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId   String
  data         DateTime @default(now())
  respostas    String   // JSON serializado com perguntas/respostas
  criadoEm     DateTime @default(now())
}

model Consentimento {
  id            String   @id @default(cuid())
  paciente      Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId    String
  procedimento  String
  data          DateTime @default(now())
  assinado      Boolean  @default(false)
  arquivoPath   String?
  criadoEm      DateTime @default(now())
}

model Foto {
  id            String   @id @default(cuid())
  paciente      Paciente @relation(fields: [pacienteId], references: [id])
  pacienteId    String
  tipo          String   // antes | depois
  procedimento  String?
  data          DateTime @default(now())
  caminho       String   // caminho do arquivo no disco
  criadoEm      DateTime @default(now())
}
```

## 8. Padrão visual (Design System)

A interface deve seguir a identidade da logo (monograma "GA", dois azuis sobre branco, tipografia em cinza).

**Paleta**
- Azul primário (ciano da logo): `#5EBFD6`
- Azul primário escuro (texto/ações/hover): `#3892AB`
- Azul primário claro (fundos/realces): `#E3F3F8`
- Azul-aço secundário: `#7DA2B0`
- Menu lateral (petróleo profundo): `#2A4B56`
- Texto principal: `#2B3138` · Texto suave: `#6B7580`
- Fundo: `#F3F7F9` · Cartões: `#FFFFFF` · Linhas: `#E4EBEF`
- Sucesso `#3AA76D` · Atenção `#D99120` · Erro `#DC5A5A`

**Tipografia:** fonte sem serifa, limpa (ex.: Inter). Títulos em peso semibold; corpo regular.

**Ícones:** biblioteca **lucide-react** (traço fino). Nada de emojis. Exemplos de uso: `Calendar` (agenda), `Users` (pacientes), `FileText` (orçamentos), `Wallet`/`DollarSign` (financeiro), `LayoutDashboard` (painel), `Settings` (config), `Camera` (fotos), `Syringe`/`Sparkles` (procedimentos).

**Componentes:** usar shadcn/ui (cartões com cantos arredondados ~14px, sombra leve; botões com estados claros; modais para formulários; tabelas com cabeçalho discreto). Layout com menu lateral fixo no desktop e menu recolhível no mobile (responsivo).

**Logo:** recriar o monograma "GA" em SVG (dois tons de azul num selo branco) para o menu, o login e o cabeçalho dos PDFs. Se o cliente enviar o arquivo vetorial oficial (SVG/PNG), usar o oficial.

## 9. Estrutura de pastas sugerida

```
sistema-dr-gustavo/
├─ CLAUDE.md
├─ docs/
│  └─ DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md   (este arquivo)
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.ts                (cria usuário admin + procedimentos)
│  ├─ src/
│  │  ├─ server.ts
│  │  ├─ auth/                  (login, hash, jwt, middleware)
│  │  ├─ routes/                (pacientes, agenda, orcamentos, financeiro...)
│  │  ├─ lib/                   (prisma client, utils)
│  │  └─ uploads/               (fotos e termos — fora do controle de versão)
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  ├─ pages/                 (Dashboard, Pacientes, Agenda, ...)
│  │  ├─ components/            (ui/ do shadcn, componentes próprios)
│  │  ├─ lib/                   (api client, formatadores BRL/data)
│  │  └─ styles/
│  └─ package.json
└─ README.md
```

## 10. Requisitos e preparação do ambiente

Você vai precisar instalar, na máquina onde vai desenvolver:

1. **Node.js 22 LTS ou superior** — https://nodejs.org (necessário para React/Vite/Node e para o Claude Code via npm). Confirme com `node --version`.
2. **Git** — https://git-scm.com (no Windows, o "Git for Windows" também melhora a experiência do Claude Code).
3. **Um editor** — recomendado o VS Code (o Claude Code tem extensão para ele).
4. **Claude Code** — veja abaixo.

> **Importante:** o Claude Code exige um plano **pago** da Anthropic (Pro, Max, Team, Enterprise) ou uma conta de API (Console). O plano gratuito do Claude.ai **não** dá acesso ao Claude Code. Confira em https://code.claude.com/docs.

### Instalar o Claude Code

Comandos oficiais (julho/2026 — confira sempre a doc oficial, pois podem mudar):

- **Windows (PowerShell):**
  ```powershell
  irm https://claude.ai/install.ps1 | iex
  ```
  ou, com WinGet:
  ```powershell
  winget install Anthropic.ClaudeCode
  ```
- **macOS / Linux / WSL:**
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- **Via npm (qualquer sistema, precisa Node 22+):**
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

Depois, confirme a instalação:
```bash
claude --version
```

Requisitos de sistema do Claude Code: Windows 10+ / macOS 13+ / Ubuntu 20.04+ (ou equivalentes), 4 GB+ de RAM e conexão com a internet.

## 11. Passo a passo para iniciar

1. **Criar a pasta do projeto**, por exemplo `sistema-dr-gustavo`, e abrir um terminal dentro dela.
2. **Colocar dentro da pasta** este arquivo (em `docs/`) e o `CLAUDE.md` (na raiz).
3. **Iniciar o Git:**
   ```bash
   git init
   ```
4. **Abrir o Claude Code** dentro da pasta:
   ```bash
   claude
   ```
   No primeiro uso, ele pede para você fazer login (abre o navegador).
5. **Colar o Prompt Inicial** (seção 12). O Claude Code vai propor um plano e começar a criar a estrutura, o banco e as telas. Vá aprovando por etapas e testando.
6. **Rodar o sistema** com os comandos que o próprio Claude Code criar (normalmente algo como `npm run dev` no backend e no frontend). Peça a ele para montar um script único que sobe tudo.
7. **Fazer commits** a cada etapa que funcionar (o Claude Code pode fazer isso por você), para nunca perder trabalho.

Dica: trabalhe por **fases pequenas** (ver seção 13). É mais fácil revisar e corrigir do que pedir "faça o sistema inteiro" de uma vez.

## 12. Prompt inicial (cole no Claude Code)

> Copie o texto abaixo e cole como sua primeira mensagem no Claude Code, já dentro da pasta do projeto (com o `CLAUDE.md` e a pasta `docs/` presentes).

```
Você vai construir um sistema web de gestão para o consultório do Dr. Gustavo Amaral
(harmonização estética). Leia o CLAUDE.md na raiz e o documento em
docs/DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md — eles definem escopo, stack, modelo de dados
e padrão visual. Siga-os à risca.

Stack obrigatória: frontend em React + Vite + TypeScript + Tailwind + shadcn/ui +
lucide-react; backend em Node + Fastify + Prisma + SQLite; autenticação própria com
bcrypt + JWT (cookie httpOnly). Sem nenhuma API ou serviço externo pago. Interface em
português do Brasil, sem emojis, usando ícones do lucide-react e a paleta da logo.

Comece assim, em fases, esperando minha aprovação a cada uma:

FASE 0 — Estrutura: crie a estrutura de pastas (backend/ e frontend/), configure os dois
projetos, o Tailwind e o shadcn/ui, e um script para rodar tudo em desenvolvimento. Ainda
sem funcionalidades. Ao final, o frontend deve abrir uma tela em branco com o layout base
(menu lateral com os ícones dos módulos e a marca "Dr. Gustavo Amaral").

FASE 1 — Banco + Autenticação: implemente o schema.prisma da documentação, gere o banco,
crie um seed com um usuário administrador e o catálogo inicial de procedimentos de
harmonização, e a tela de login funcional.

Pare após a FASE 0 e me mostre o resultado antes de seguir. Explique cada decisão de forma
simples, porque eu não sou desenvolvedor experiente.
```

## 13. Roadmap por fases

- **Fase 0 —** Estrutura do projeto e layout base.
- **Fase 1 —** Banco de dados + autenticação (login).
- **Fase 2 —** Pacientes (cadastro, busca, ficha).
- **Fase 3 —** Agenda (CRUD, status, conflito, WhatsApp).
- **Fase 4 —** Procedimentos (catálogo) + Prontuário clínico (produto/lote/quantidade).
- **Fase 5 —** Orçamentos (itens, status, PDF, WhatsApp).
- **Fase 6 —** Financeiro (pagamentos, faturamento, relatórios).
- **Fase 7 —** Anamnese, Consentimento e Fotos antes/depois.
- **Fase 8 —** Configurações + Backup + polimento visual.
- **Fase 9 —** Build de produção + atalho de inicialização; (opcional) acesso pelo celular na rede.
- **Futuro —** Publicação em VPS próprio para acesso remoto; migração para PostgreSQL se necessário.

## 14. Checklist de segurança e LGPD

- Senhas sempre com hash (bcrypt); nunca guardar/log de senha em texto.
- Sessão via cookie httpOnly; expiração de sessão.
- Backup regular do arquivo do banco e da pasta de fotos, guardado em local seguro.
- Máquina do consultório protegida por senha de sistema.
- Aviso de tratamento de dados sensíveis e registro de consentimento dos pacientes.
- Nada de envio automático de dados para serviços externos.

---

*Documento gerado pela Herval Marketing para orientar o desenvolvimento no Claude Code. Ajuste livremente conforme o projeto evolui.*
