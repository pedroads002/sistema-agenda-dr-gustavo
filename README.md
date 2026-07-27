# Sistema Dr. Gustavo Amaral

Sistema de gestão do consultório (agenda, pacientes, procedimentos, orçamentos, financeiro,
anamnese/consentimento, fotos antes/depois, configurações e backup).

Este documento é o guia rápido de instalação e uso do dia a dia. O escopo completo do sistema
está em `docs/DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md`.

## Uso no dia a dia (depois de instalado)

1. Dê **duplo-clique** no arquivo **`Iniciar Sistema.command`**, na pasta do sistema.
2. Uma janela do Terminal abre sozinha e, em poucos segundos, o navegador abre em
   `http://localhost:3000` já com o sistema.
3. Faça login com seu e-mail e senha.
4. Para **desligar** o sistema: feche a janela do Terminal que abriu (ou clique nela e
   pressione `Ctrl+C`). Fechar só a aba do navegador não desliga o sistema.

Se a janela do Terminal fechar sozinha ou aparecer uma mensagem de erro, chame quem cuida do
sistema para ajudar — não é normal.

## Instalação (feita uma vez, ou quando o sistema for atualizado)

Pré-requisitos: Node.js 22 ou mais novo instalado no Mac (`node -v` no Terminal para conferir).

1. Copie a pasta do sistema para o computador do consultório.
2. Dentro da pasta `backend/`, crie o arquivo `.env` a partir do `backend/.env.example`,
   preenchendo pelo menos o `JWT_SECRET` (uma frase longa e aleatória — segredo interno do
   sistema). O e-mail e a senha do administrador podem ficar em branco: o próximo passo
   pergunta os dois no Terminal.
3. No Terminal, dentro da pasta do sistema, rode uma vez:
   ```
   npm run setup
   ```
   Esse comando instala tudo, prepara o banco de dados e pergunta o e-mail e a senha do
   administrador (a senha não fica visível ao digitar).
4. Depois disso, o uso do dia a dia é só o item acima: duplo-clique em
   `Iniciar Sistema.command`.

## Acesso pelo celular (opcional, mesma rede Wi-Fi)

O sistema também pode ser aberto de um celular ou outro computador, **desde que estejam
conectados na mesma rede Wi-Fi** do computador do consultório.

1. Com o sistema ligado, descubra o IP local do Mac: Menu Apple → Ajustes do Sistema → Wi-Fi
   → Detalhes (ou, no Terminal: `ipconfig getifaddr en0`). Algo como `192.168.100.5`.
2. No celular (na mesma Wi-Fi), abra o navegador em `http://SEU-IP:3000` (ex.:
   `http://192.168.100.5:3000`).
3. O login continua sendo exigido normalmente.

**Importante:**
- Isso só funciona dentro da mesma rede Wi-Fi do consultório — não funciona pela internet, de
  fora do consultório, nem com dados móveis.
- **Não configure o roteador para expor essa porta na internet** (nada de "abrir porta" ou
  redirecionamento). O sistema não tem HTTPS e não foi feito para ficar exposto na internet.
- Se o Mac mudar de rede Wi-Fi, o IP local muda — repita o passo 1.

## Backup

Na tela **Configurações** do sistema, o botão **"Exportar backup (.zip)"** baixa um arquivo
com o banco de dados e todas as fotos/anexos enviados até aquele momento.

- Guarde esse arquivo em um local seguro fora do computador (pendrive, HD externo, nuvem
  pessoal) — ele contém dados sensíveis de pacientes.
- Recomendação: faça esse backup com frequência (ex.: toda semana) e sempre antes de qualquer
  atualização do sistema.

### Como restaurar um backup

1. Desligue o sistema (feche a janela do `Iniciar Sistema.command`).
2. Extraia o `.zip` do backup.
3. Substitua o arquivo `backend/data/consultorio.db` pelo `consultorio.db` extraído.
4. Substitua a pasta `backend/uploads` pela pasta `uploads` extraída.
5. Ligue o sistema novamente (`Iniciar Sistema.command`).

## Publicar na internet (Cloudflare Tunnel)

O sistema roda inteiramente local (SQLite + fotos em pasta local, sem nenhum serviço pago na
nuvem). Para acessá-lo de fora da rede do consultório, a forma recomendada é um túnel do
Cloudflare (`cloudflared`) apontando para `http://localhost:3000` — ele fica fora do escopo
deste projeto (é configurado direto no Cloudflare/terminal, não pelo sistema), mas não exige
nenhuma mudança de código: o sistema já roda numa porta fixa, pronto para ser apontado.

Se o túnel entregar HTTPS de ponta a ponta até o navegador, pode opcionalmente definir
`COOKIE_SECURE=true` no `backend/.env` para reforçar a segurança do cookie de login (veja
`backend/.env.example`).

## Stack técnica

React + Vite + TypeScript + Tailwind + shadcn/ui no frontend; Node.js + Fastify + Prisma +
SQLite no backend. Em produção, o backend também serve o frontend já compilado — tudo roda
numa porta só (`http://localhost:3000`). Sem serviços externos pagos. Mais detalhes em
`docs/DOCUMENTACAO-SISTEMA-DR-GUSTAVO.md`.

## Desenvolvimento

Para desenvolver (frontend e backend rodando separados, com recarregamento automático):

```
npm install
npm run dev
```

Frontend em `http://localhost:5173` (proxy para a API em `http://localhost:3000`).
