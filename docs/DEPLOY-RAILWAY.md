# Deploy em produção no Railway

Este guia explica como colocar o sistema no ar no [Railway](https://railway.app), com o banco
SQLite e as fotos/anexos guardados num **volume persistente** (para não se perderem a cada
novo deploy). Siga a ordem abaixo — é só configuração, nenhuma funcionalidade do sistema muda.

## 1. Criar o serviço

1. No Railway, crie um novo projeto a partir deste repositório (GitHub).
2. O Railway detecta o `railway.json` na raiz automaticamente e usa:
   - **Build:** `npm run build` (compila o frontend e o backend).
   - **Start:** `npm run start` (aplica as migrações do banco, cria/atualiza o usuário
     administrador e liga o servidor).

## 2. Adicionar um volume persistente

Sem isso, o banco de dados e as fotos somem a cada novo deploy — **este passo é obrigatório**.

1. No serviço, vá em **Settings → Volumes** e crie um volume.
2. Defina o **caminho de montagem (mount path)** como `/data`.

## 3. Configurar as variáveis de ambiente

Em **Settings → Variables**, adicione:

| Variável | Valor | Observação |
|---|---|---|
| `DATABASE_URL` | `file:/data/consultorio.db` | Banco de dados dentro do volume persistente |
| `UPLOADS_DIR` | `/data/uploads` | Fotos/anexos dentro do volume persistente |
| `JWT_SECRET` | uma frase longa e aleatória | Segredo interno do sistema — nunca reaproveite a do ambiente local |
| `COOKIE_SECURE` | `true` | O Railway fornece HTTPS automaticamente; o cookie de login deve exigir HTTPS |
| `SEED_ADMIN_EMAIL` | e-mail de acesso do Dr. Gustavo | Usado para criar o usuário administrador |
| `SEED_ADMIN_SENHA` | uma senha forte | Troque depois pelo próprio sistema, em "Trocar senha" |

Não é preciso definir `PORT` — o Railway define essa variável sozinho, e o sistema já lê
automaticamente.

## 4. Deploy

Publique o deploy. Ao subir, o sistema:
1. Aplica as migrações do banco de dados no volume (`prisma migrate deploy`).
2. Cria o usuário administrador, se ainda não existir (`prisma db seed` — não faz nada se ele
   já existir, então é seguro isso rodar em todo novo deploy).
3. Liga o servidor, servindo a interface e a API na mesma URL que o Railway fornecer.

Acesse a URL do serviço, faça login com o e-mail/senha definidos em `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_SENHA`, e depois troque a senha em "Trocar senha".

## 5. Backup

O botão **"Exportar backup (.zip)"** na tela de Configurações funciona normalmente em
produção — baixa o banco de dados e as fotos direto do volume persistente. Recomenda-se
continuar fazendo esse backup com frequência e guardando o arquivo fora do Railway.

## Notas

- O domínio gerado pelo Railway já tem HTTPS; não é necessário configurar nada a mais.
- Se o serviço for reiniciado ou receber um novo deploy, os dados continuam intactos — eles
  vivem no volume (`/data`), não no restante do sistema de arquivos do container, que é
  descartado a cada deploy.
- Não é necessário (nem recomendado) rodar mais de uma instância do serviço ao mesmo tempo,
  já que o banco é um arquivo SQLite único dentro do volume.
