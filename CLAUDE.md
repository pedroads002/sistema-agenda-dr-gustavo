# CLAUDE.md — Regras do projeto (Sistema Dr. Gustavo Amaral)

Este arquivo é lido automaticamente pelo Claude Code. Ele define como o sistema deve ser
construído. **Sempre siga estas regras.** O escopo completo está em
`docs/DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md` — leia antes de agir.

## Contexto
Sistema web de gestão para o consultório do Dr. Gustavo Amaral (harmonização estética:
facial, íntima masculina, íntima feminina e corporal). Substitui Google Agenda + caderno.
Uso no navegador, no computador do consultório. Um único perfil de acesso (mesmas
permissões para todos os usuários). Dados sensíveis de saúde (LGPD).

## Interlocutor
Quem conduz o projeto **não é desenvolvedor experiente**. Explique decisões em português
simples, evite jargão desnecessário, e nunca faça um passo grande sem descrever antes o
que vai fazer. Trabalhe em fases pequenas e peça aprovação entre elas.

## Idioma
- Todo o produto (interface, mensagens, rótulos) em **português do Brasil**.
- Nomes de variáveis/código podem ser em português ou inglês, mas **seja consistente**.
- Comentários e explicações para o usuário: português.

## Stack (obrigatória — não trocar sem pedir)
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, lucide-react (ícones),
  React Router, TanStack Query, react-hook-form + zod.
- **Backend:** Node.js 22+, Fastify, Prisma ORM, **SQLite**.
- **Auth:** própria, com bcrypt (hash de senha) + JWT em cookie httpOnly. Sem login externo.
- **Sem nenhuma API/serviço externo pago.** Sem Supabase, Firebase, Auth0, etc.

## Regras de ouro
1. **Nada de emojis na interface.** Use ícones do lucide-react.
2. **Sem serviços externos.** O botão de WhatsApp usa apenas link `wa.me` (abre o app do
   usuário); isso é permitido. PDF é gerado localmente. Nada sai para terceiros.
3. **Dados sensíveis:** senhas com hash; nunca logar senha; acesso protegido por login.
4. **Dinheiro** em BRL, guardado como número, formatado só na exibição (`Intl.NumberFormat`).
5. **Datas** guardadas de forma consistente; exibidas no fuso de Brasília (America/Sao_Paulo).
6. **Responsivo:** funciona bem no desktop (foco) e no celular (menu recolhível).
7. **Rastreabilidade clínica:** procedimentos realizados registram produto, lote, validade
   e quantidade (ml/UI). Não simplificar isso.

## Padrão visual
Seguir a identidade da logo. Paleta:
- Primária `#5EBFD6` · Primária escura `#3892AB` · Primária clara `#E3F3F8`
- Secundária (aço) `#7DA2B0` · Menu lateral `#2A4B56`
- Texto `#2B3138` · Texto suave `#6B7580` · Fundo `#F3F7F9` · Cartão `#FFFFFF` · Linha `#E4EBEF`
- Sucesso `#3AA76D` · Atenção `#D99120` · Erro `#DC5A5A`
Tipografia limpa (ex.: Inter). Cartões arredondados, sombra leve, layout com menu lateral.
Recriar o monograma "GA" em SVG (dois azuis em selo branco) para menu, login e PDFs.

## Organização do código
- Estrutura `backend/` e `frontend/` separadas (ver documentação).
- Backend: rotas por módulo em `src/routes/`; validação com zod na entrada da API.
- Frontend: páginas em `src/pages/`, componentes reutilizáveis em `src/components/`,
  formatadores e cliente de API em `src/lib/`.
- Uploads (fotos, termos) em `backend/src/uploads/`, **fora** do Git.

## Qualidade e segurança
- Validar dados no backend, não confiar só no frontend.
- Tratar erros com mensagens claras ao usuário (nada de tela branca).
- ESLint + Prettier configurados; código formatado.
- **Testar** cada fase antes de considerar concluída (ao menos os fluxos principais).
- Não introduzir dependências desnecessárias; preferir a stack já definida.

## Git
- Commits pequenos e descritivos em português, a cada etapa que funciona.
- `.gitignore` deve incluir: `node_modules/`, o arquivo do banco (`*.db`), `uploads/`,
  arquivos `.env` e builds.
- Nunca comitar segredos (chave do JWT, senhas) — usar arquivo `.env`.

## Fluxo de trabalho com o usuário
- Antes de cada fase, descreva em poucas linhas o que fará.
- Depois de cada fase, explique o que foi feito e como testar.
- Pare e pergunte quando houver uma decisão que muda o produto (ex.: um campo novo,
  uma regra de negócio ambígua). Não invente regra clínica sem confirmar.
